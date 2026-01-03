import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExpenseCalculationResponseDto,
  UserBalanceDto,
  PaymentSettlementDto
} from './dto/expense-calculation.dto';

@Injectable()
export class ExpenseCalculationService {
  constructor(private prisma: PrismaService) { }

  async calculateTripExpenses(tripId: string): Promise<ExpenseCalculationResponseDto> {
    // Get all trip members (including owner)
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        },
        members: {
          where: {
            status: 'accepted'
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Get all expenses for this trip
    const expenses = await this.prisma.expense.findMany({
      where: { tripId },
      include: {
        payer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });

    // Create list of all trip members (owner + members) - avoid duplicates
    const memberMap = new Map();

    // Add trip owner
    memberMap.set(trip.user.id, {
      id: trip.user.id,
      email: trip.user.email,
      fullName: trip.user.fullName,
      profilePicture: (trip.user as any).profilePicture
    });

    // Add trip members (this will not duplicate the owner if they're also a member)
    trip.members.forEach(member => {
      memberMap.set(member.user.id, {
        id: member.user.id,
        email: member.user.email,
        fullName: member.user.fullName,
        profilePicture: (member.user as any).profilePicture
      });
    });

    const allMembers = Array.from(memberMap.values());

    // Get all transactions for this trip using Prisma
    const allTransactions = await this.prisma.paymentTransaction.findMany({
      where: { settlement: { tripId } },
      include: { settlement: { select: { tripId: true } } }
    });

    // Filter only successful transactions
    const transactions = allTransactions.filter(t => t.status === 'success');


    // Calculate balances for each user
    const userBalances: UserBalanceDto[] = allMembers.map(member => {
      let totalPaid = 0;
      let totalOwed = 0;
      let totalReceived = 0;
      let totalPaidOut = 0;

      // Calculate total paid by this user
      expenses.forEach(expense => {
        if (expense.payerId === member.id) {
          totalPaid += Number(expense.amount);
        }
      });

      // Calculate total owed by this user (the new logic uses per-participant amount)
      expenses.forEach(expense => {
        const participation = expense.participants.find(p => p.userId === member.id);
        if (participation) {
          totalOwed += Number((participation as any).amount ?? 0);
        }
      });

      // Calculate total received and paid out from successful transactions
      transactions.forEach(transaction => {
        if (transaction.toUserId === member.id) {
          totalReceived += Number(transaction.amount);
        }
        if (transaction.fromUserId === member.id) {
          totalPaidOut += Number(transaction.amount);
        }
      });

      const netBalance = totalPaid - totalOwed;
      // remaining < 0: vẫn còn phải trả; remaining > 0: vẫn còn được nhận
      const remaining = netBalance - (totalReceived - totalPaidOut);

      return {
        userId: member.id,
        user: member,
        totalPaid,
        totalOwed,
        netBalance,
        totalReceived,
        totalPaidOut,
        remaining
      };
    });

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Generate optimal settlements using the "settle up" algorithm
    const settlements = this.calculateOptimalSettlements(userBalances);

    // Check if all balances are settled
    const isBalanced = settlements.length === 0 || settlements.every(s => s.amount === 0);

    return {
      tripId,
      totalExpenses,
      transactionCount: expenses.length,
      userBalances,
      settlements,
      isBalanced
    };
  }

  private calculateOptimalSettlements(userBalances: UserBalanceDto[]): PaymentSettlementDto[] {
    const settlements: PaymentSettlementDto[] = [];

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = userBalances
      .filter(u => (u as any).remaining !== undefined ? (u as any).remaining > 0 : u.netBalance > 0)
      .map(u => ({ ...u, _remain: (u as any).remaining !== undefined ? (u as any).remaining : u.netBalance }))
      .sort((a, b) => b._remain - a._remain);

    const debtors = userBalances
      .filter(u => (u as any).remaining !== undefined ? (u as any).remaining < 0 : u.netBalance < 0)
      .map(u => ({ ...u, _remain: (u as any).remaining !== undefined ? (u as any).remaining : u.netBalance }))
      .sort((a, b) => a._remain - b._remain);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex] as any;
      const debtor = debtors[debtorIndex] as any;

      const settlementAmount = Math.min(creditor._remain, Math.abs(debtor._remain));

      if (settlementAmount > 0.01) { // Only create settlement if amount is significant
        settlements.push({
          debtorId: debtor.userId,
          debtor: debtor.user,
          creditorId: creditor.userId,
          creditor: creditor.user,
          amount: settlementAmount
        });
      }

      // Update balances
      creditor._remain -= settlementAmount;
      debtor._remain += settlementAmount;

      // Move to next creditor/debtor if current one is settled
      if (Math.abs(creditor._remain) < 0.01) {
        creditorIndex++;
      }
      if (Math.abs(debtor._remain) < 0.01) {
        debtorIndex++;
      }
    }

    return settlements;
  }

  async createPaymentSettlements(tripId: string): Promise<void> {
    const calculation = await this.calculateTripExpenses(tripId);

    await this.prisma.$transaction(async (tx) => {
      const requiredMap = new Map<string, number>();

      for (const s of calculation.settlements) {
        const key = `${s.debtorId}|${s.creditorId}`; // Use | as separator instead of -
        requiredMap.set(key, (requiredMap.get(key) || 0) + Number(s.amount));
      }

      const existingPairs = await tx.paymentSettlement.findMany({
        where: { tripId },
        select: { debtorId: true, creditorId: true },
        distinct: ['debtorId', 'creditorId']
      });

      const pairsToProcess = new Set<string>([...requiredMap.keys()]);
      for (const p of existingPairs) pairsToProcess.add(`${p.debtorId}|${p.creditorId}`);

      for (const pair of pairsToProcess) {
        const pipeIndex = pair.indexOf('|');
        const debtorId = pair.substring(0, pipeIndex);
        const creditorId = pair.substring(pipeIndex + 1);
        const required = requiredMap.get(pair) || 0;

        const existing = await tx.paymentSettlement.findFirst({
          where: { tripId, debtorId, creditorId },
          orderBy: { createdAt: 'desc' }
        });

        let totalPaid = 0;

        if (existing) {
          const aggregate = await tx.paymentTransaction.aggregate({
            where: { settlementId: existing.id, status: 'success' },
            _sum: { amount: true }
          });
          totalPaid = Number(aggregate._sum.amount ?? 0);
        }

        const desiredPending = required;

        if (existing) {
          if (existing.status === 'pending') {
            // Đang pending: ghi đè amount theo tính toán mới (không triệt tiêu chiều ngược lại)
            await tx.paymentSettlement.update({
              where: { id: existing.id },
              data: {
                amount: desiredPending,
                status: desiredPending > 0 ? 'pending' : 'completed',
                settledAt: desiredPending > 0 ? null : new Date()
              }
            });
          } else if (existing.status === 'completed') {
            // Đã completed cùng chiều: cộng dồn amount mới và mở lại pending
            if (desiredPending > 0.01) {
              await tx.paymentSettlement.update({
                where: { id: existing.id },
                data: {
                  amount: Number(existing.amount) + desiredPending,
                  status: 'pending',
                  settledAt: null
                }
              });
            }
            // Nếu desiredPending ~ 0 thì giữ nguyên completed
          } else {
            // Phòng xa: các trạng thái khác -> ghi đè amount
            await tx.paymentSettlement.update({
              where: { id: existing.id },
              data: { amount: desiredPending }
            });
          }
        } else if (desiredPending > 0.01) {
          await tx.paymentSettlement.create({
            data: {
              tripId,
              debtorId,
              creditorId,
              amount: desiredPending,
              status: 'pending'
            }
          });
        }
      }
    });
  }
}

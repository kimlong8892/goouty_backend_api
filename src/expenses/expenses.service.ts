import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseResponseDto, ExpenseListResponseDto } from './dto/expense-response.dto';
import { ExpenseCalculationService } from './expense-calculation.service';
import {
  ExpenseCalculationResponseDto
} from './dto/expense-calculation.dto';
import {
  UpdatePaymentSettlementDto,
  PaymentSettlementResponseDto as SettlementResponseDto
} from './dto/payment-settlement.dto';
import {
  CreatePaymentTransactionDto,
  PaymentTransactionResponseDto
} from './dto/payment-transaction.dto';
import { EnhancedNotificationService } from '../notifications/enhanced-notification.service';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private expenseCalculationService: ExpenseCalculationService,
    private notificationService: EnhancedNotificationService
  ) { }

  async create(createExpenseDto: CreateExpenseDto, userId: string): Promise<ExpenseResponseDto> {
    // Verify trip exists and user has access
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: createExpenseDto.tripId,
        OR: [
          { userId: userId }, // User is owner
          { members: { some: { userId: userId } } } // User is member
        ]
      }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found or access denied');
    }

    // Verify payer is a member of the trip (must be accepted)
    const payerMembership = await this.prisma.tripMember.findFirst({
      where: {
        tripId: createExpenseDto.tripId,
        userId: createExpenseDto.payerId,
        status: 'accepted'
      }
    });

    if (!payerMembership && createExpenseDto.payerId !== trip.userId) {
      throw new BadRequestException('Payer must be an accepted member of the trip');
    }

    // Verify all participants are accepted members of the trip (including owner)
    const participantMemberships = await this.prisma.tripMember.findMany({
      where: {
        tripId: createExpenseDto.tripId,
        userId: { in: createExpenseDto.participantIds },
        status: 'accepted'
      }
    });

    const ownerId = trip.userId;
    const validParticipantIds = [
      ...participantMemberships.map(m => m.userId),
      ownerId // Owner is always a valid participant
    ];

    const invalidParticipants = createExpenseDto.participantIds.filter(
      id => !validParticipantIds.includes(id)
    );

    if (invalidParticipants.length > 0) {
      throw new BadRequestException('Some participants are not members of the trip');
    }

    // Validate and compute per-participant amounts
    let perParticipantAmounts: number[];
    if (createExpenseDto.amounts && createExpenseDto.amounts.length > 0) {
      if (createExpenseDto.amounts.length !== createExpenseDto.participantIds.length) {
        throw new BadRequestException('Amounts length must match participantIds length');
      }
      const sum = createExpenseDto.amounts.reduce((a, b) => a + Number(b), 0);
      if (sum !== Number(createExpenseDto.amount)) {
        throw new BadRequestException('Sum of participant amounts must equal total amount');
      }
      perParticipantAmounts = createExpenseDto.amounts.map(n => Number(n));
    } else {
      // Split equally by default (VND integer)
      const totalInt = Number(createExpenseDto.amount);
      const n = createExpenseDto.participantIds.length;
      const base = Math.floor(totalInt / n);
      let remainder = totalInt - base * n; // distribute +1 VND for first 'remainder' participants
      perParticipantAmounts = createExpenseDto.participantIds.map(() => {
        if (remainder > 0) {
          remainder -= 1;
          return base + 1;
        }
        return base;
      });
    }

    // Create expense with participants
    const expense = await this.prisma.expense.create({
      data: {
        title: createExpenseDto.title,
        amount: new Prisma.Decimal(createExpenseDto.amount),
        date: new Date(createExpenseDto.date),
        description: createExpenseDto.description,
        tripId: createExpenseDto.tripId,
        payerId: createExpenseDto.payerId,
        participants: {
          create: createExpenseDto.participantIds.map((participantId, idx) => ({
            userId: participantId,
            amount: new Prisma.Decimal(perParticipantAmounts[idx])
          }))
        }
      },
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

    // Automatically create payment settlements after creating expense
    await this.expenseCalculationService.createPaymentSettlements(createExpenseDto.tripId);

    // Send notification about expense creation
    try {
      await this.notificationService.sendExpenseAddedNotification(
        createExpenseDto.tripId,
        trip.title,
        createExpenseDto.title,
        Number(createExpenseDto.amount),
        userId
      );
    } catch (error) {
      console.error('Failed to send expense creation notification:', error);
      // Don't throw error here to avoid breaking expense creation
    }

    return this.mapToResponseDto(expense);
  }

  async findAllByTrip(tripId: string, userId: string): Promise<ExpenseListResponseDto[]> {
    // Verify user has access to trip
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: userId }, // User is owner
          { members: { some: { userId: userId } } } // User is member
        ]
      }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found or access denied');
    }

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
      },
      orderBy: { createdAt: 'desc' }
    });

    return expenses.map(expense => this.mapToListResponseDto(expense));
  }

  async findOne(id: string, userId: string): Promise<ExpenseResponseDto> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        trip: true,
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

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Verify user has access to the trip
    const hasAccess = expense.trip.userId === userId ||
      await this.prisma.tripMember.findFirst({
        where: {
          tripId: expense.tripId,
          userId: userId
        }
      });

    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapToResponseDto(expense);
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, userId: string): Promise<ExpenseResponseDto> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { trip: true }
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Check if expense is locked
    const lockCheck = await this.prisma.expense.findUnique({
      where: { id },
      select: { isLocked: true }
    });
    if (lockCheck?.isLocked) {
      throw new BadRequestException('Expense đã được khóa và không thể chỉnh sửa');
    }

    // If updating participants, verify they are trip members
    if (updateExpenseDto.participantIds) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: expense.tripId },
        include: {
          members: {
            where: { status: 'accepted' }
          }
        }
      });

      const validParticipantIds = [
        ...trip.members.map(m => m.userId),
        trip.userId
      ];

      const invalidParticipants = updateExpenseDto.participantIds.filter(
        id => !validParticipantIds.includes(id)
      );

      if (invalidParticipants.length > 0) {
        throw new BadRequestException('Some participants are not members of the trip');
      }
    }

    // Prepare per-participant amounts if participants are updated
    let updateParticipantsBlock: any = undefined;
    if (updateExpenseDto.participantIds) {
      const totalAmount = updateExpenseDto.amount !== undefined
        ? Number(updateExpenseDto.amount)
        : Number(expense.amount);
      let perParticipantAmounts: number[];
      if (updateExpenseDto.amounts && updateExpenseDto.amounts.length > 0) {
        if (updateExpenseDto.amounts.length !== updateExpenseDto.participantIds.length) {
          throw new BadRequestException('Amounts length must match participantIds length');
        }
        const sum = updateExpenseDto.amounts.reduce((a, b) => a + Number(b), 0);
        if (sum !== totalAmount) {
          throw new BadRequestException('Sum of participant amounts must equal total amount');
        }
        perParticipantAmounts = updateExpenseDto.amounts.map(n => Number(n));
      } else {
        // Equal split (VND integer)
        const n = updateExpenseDto.participantIds.length;
        const base = Math.floor(totalAmount / n);
        let remainder = totalAmount - base * n;
        perParticipantAmounts = updateExpenseDto.participantIds.map(() => {
          if (remainder > 0) {
            remainder -= 1;
            return base + 1;
          }
          return base;
        });
      }
      updateParticipantsBlock = {
        participants: {
          deleteMany: {},
          create: updateExpenseDto.participantIds.map((participantId, idx) => ({
            userId: participantId,
            amount: new Prisma.Decimal(perParticipantAmounts[idx])
          }))
        }
      };
    }

    // Update expense
    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(updateExpenseDto.title && { title: updateExpenseDto.title }),
        ...(updateExpenseDto.amount !== undefined && { amount: new Prisma.Decimal(updateExpenseDto.amount) }),
        ...(updateExpenseDto.date && { date: new Date(updateExpenseDto.date) }),
        ...(updateExpenseDto.description !== undefined && { description: updateExpenseDto.description }),
        ...(updateExpenseDto.payerId && { payerId: updateExpenseDto.payerId }),
        ...(updateParticipantsBlock || {})
      } as Prisma.ExpenseUpdateInput,
      include: {
        payer: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true
              }
            }
          }
        }
      }
    });

    // Automatically update payment settlements after updating expense
    await this.expenseCalculationService.createPaymentSettlements(expense.tripId);

    // Send notification about expense update
    try {
      const trip = await this.prisma.trip.findUnique({
        where: { id: expense.tripId },
        select: { title: true }
      });

      if (trip) {
        await this.notificationService.sendExpenseUpdatedNotification(
          expense.tripId,
          trip.title,
          updatedExpense.title,
          userId
        );
      }
    } catch (error) {
      console.error('Failed to send expense update notification:', error);
      // Don't throw error here to avoid breaking expense update
    }

    return this.mapToResponseDto(updatedExpense);
  }

  async remove(id: string, userId: string): Promise<void> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { trip: true }
    }) as any;

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Check if expense is locked
    const lockCheck = await this.prisma.expense.findUnique({
      where: { id },
      select: { isLocked: true }
    });
    if (lockCheck?.isLocked) {
      throw new BadRequestException('Expense đã được khóa và không thể xóa');
    }

    // Only trip owner or expense payer can delete
    if (expense.trip.userId !== userId && expense.payerId !== userId) {
      throw new ForbiddenException('Only trip owner or expense payer can delete');
    }

    await this.prisma.expense.delete({
      where: { id }
    });

    // Automatically update payment settlements after deleting expense
    await this.expenseCalculationService.createPaymentSettlements(expense.tripId);
  }

  async calculateTripExpenses(tripId: string, userId: string): Promise<ExpenseCalculationResponseDto> {
    // Verify user has access to trip
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: userId }, // User is owner
          { members: { some: { userId: userId } } } // User is member
        ]
      }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found or access denied');
    }

    return this.expenseCalculationService.calculateTripExpenses(tripId);
  }

  async createPaymentSettlements(tripId: string, userId: string): Promise<void> {
    // Verify user has access to trip
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: userId }, // User is owner
          { members: { some: { userId: userId } } } // User is member
        ]
      }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found or access denied');
    }

    await this.expenseCalculationService.createPaymentSettlements(tripId);
  }

  async getPaymentSettlements(tripId: string, userId: string): Promise<SettlementResponseDto[]> {
    // Verify user has access to trip
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: userId }, // User is owner
          { members: { some: { userId: userId } } } // User is member
        ]
      }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found or access denied');
    }

    const settlements = await this.prisma.paymentSettlement.findMany({
      where: { tripId },
      include: {
        debtor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true,
            bankId: true,
            bankNumber: true
          }
        },
        creditor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true,
            bankId: true,
            bankNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return settlements.map(settlement => this.mapSettlementToResponseDto(settlement));
  }

  async updatePaymentSettlement(
    settlementId: string,
    updateDto: UpdatePaymentSettlementDto,
    userId: string
  ): Promise<SettlementResponseDto> {
    const settlement = await this.prisma.paymentSettlement.findUnique({
      where: { id: settlementId },
      include: { trip: true }
    });

    if (!settlement) {
      throw new NotFoundException('Payment settlement not found');
    }

    // Verify user has access to the trip
    const hasAccess = settlement.trip.userId === userId ||
      await this.prisma.tripMember.findFirst({
        where: {
          tripId: settlement.tripId,
          userId: userId
        }
      });

    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    const updatedSettlement = await this.prisma.paymentSettlement.update({
      where: { id: settlementId },
      data: {
        ...(updateDto.status && {
          status: updateDto.status,
          ...(updateDto.status === 'completed' && { settledAt: new Date() })
        }),
        ...(updateDto.description !== undefined && { description: updateDto.description })
      },
      include: {
        debtor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        },
        creditor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        }
      }
    });

    return this.mapSettlementToResponseDto(updatedSettlement);
  }

  async createPaymentTransaction(
    settlementId: string,
    dto: CreatePaymentTransactionDto,
    userId: string
  ): Promise<PaymentTransactionResponseDto> {
    console.log("Data debug =============>", dto);

    const settlement = await this.prisma.paymentSettlement.findUnique({
      where: { id: settlementId },
      include: { trip: true }
    });

    if (!settlement) {
      throw new NotFoundException('Payment settlement not found');
    }

    // Verify user has access to the trip (owner or member)
    const isTripOwner = settlement.trip.userId === userId;
    const isTripMember = await this.prisma.tripMember.findFirst({
      where: { tripId: settlement.tripId, userId }
    });

    if (!isTripOwner && !isTripMember) {
      throw new ForbiddenException('Access denied to this trip');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate amount against remaining using aggregate
    const aggregate = await this.prisma.paymentTransaction.aggregate({
      where: { settlementId, status: 'success' },
      _sum: { amount: true }
    });
    const totalPaid = Number(aggregate._sum.amount ?? 0);
    const remainingBefore = Number(settlement.amount) - totalPaid;

    if (dto.amount > remainingBefore + 1e-6) {
      throw new BadRequestException('Amount exceeds remaining balance of this settlement');
    }

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        settlementId,
        fromUserId: settlement.debtorId,
        toUserId: settlement.creditorId,
        amount: dto.amount,
        status: dto.status ?? 'success',
        method: dto.method,
        note: dto.note,
      },
    });

    // Auto-complete when fully paid
    const remainingAfter = remainingBefore - ((dto.status ?? 'success') === 'success' ? dto.amount : 0);
    if (remainingAfter <= 0) {
      await this.prisma.paymentSettlement.update({
        where: { id: settlementId },
        data: { status: 'completed', settledAt: new Date() }
      });
    }

    // Lock expenses when transaction is successful
    if ((dto.status ?? 'success') === 'success') {
      await this.lockExpensesForTrip(settlement.tripId);
    }

    // Send notification about payment transaction
    if ((dto.status ?? 'success') === 'success') {
      try {
        const trip = await this.prisma.trip.findUnique({
          where: { id: settlement.tripId },
          select: { title: true }
        });

        const debtor = await this.prisma.user.findUnique({
          where: { id: settlement.debtorId },
          select: { fullName: true }
        });

        const creditor = await this.prisma.user.findUnique({
          where: { id: settlement.creditorId },
          select: { fullName: true }
        });

        if (trip && debtor && creditor) {
          await this.notificationService.sendPaymentCreatedNotification(
            settlement.tripId,
            trip.title,
            debtor.fullName || 'Người dùng',
            creditor.fullName || 'Người dùng',
            dto.amount,
            userId
          );
        }
      } catch (error) {
        console.error('Failed to send payment notification:', error);
        // Don't throw error here to avoid breaking payment transaction
      }
    }

    return this.mapTransactionToResponseDto(transaction);
  }

  async getPaymentTransactions(
    settlementId: string,
    userId: string
  ): Promise<PaymentTransactionResponseDto[]> {
    const settlement = await this.prisma.paymentSettlement.findUnique({
      where: { id: settlementId },
      include: { trip: true }
    });

    if (!settlement) {
      throw new NotFoundException('Payment settlement not found');
    }

    // Verify user has access to the trip (owner or member) or is debtor/creditor
    const isTripOwner = settlement.trip.userId === userId;
    const isTripMember = await this.prisma.tripMember.findFirst({
      where: { tripId: settlement.tripId, userId }
    });
    const isParty = userId === settlement.debtorId || userId === settlement.creditorId;

    if (!isTripOwner && !isTripMember && !isParty) {
      throw new ForbiddenException('Access denied');
    }

    const txs = await this.prisma.paymentTransaction.findMany({
      where: { settlementId },
      orderBy: { createdAt: 'desc' }
    });

    return txs.map(t => this.mapTransactionToResponseDto(t));
  }

  private mapSettlementToResponseDto(settlement: any): SettlementResponseDto {
    return {
      id: settlement.id,
      amount: Number(settlement.amount),
      status: settlement.status,
      description: settlement.description,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
      settledAt: settlement.settledAt,
      tripId: settlement.tripId,
      debtorId: settlement.debtorId,
      debtor: settlement.debtor,
      creditorId: settlement.creditorId,
      creditor: settlement.creditor
    };
  }

  private mapToListResponseDto(expense: any): ExpenseListResponseDto {
    return {
      id: expense.id,
      title: expense.title,
      amount: Number(expense.amount),
      date: expense.date,
      description: expense.description,
      isLocked: expense.isLocked,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      tripId: expense.tripId,
      payerId: expense.payerId,
      payer: expense.payer,
      participants: expense.participants.map(p => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        amount: Number(p.amount),
        createdAt: p.createdAt
      }))
    };
  }

  private mapToResponseDto(expense: any): ExpenseResponseDto {
    return {
      id: expense.id,
      title: expense.title,
      amount: Number(expense.amount),
      date: expense.date,
      description: expense.description,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      tripId: expense.tripId,
      payerId: expense.payerId,
      payer: expense.payer,
      participants: expense.participants.map(p => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        amount: Number(p.amount),
        createdAt: p.createdAt
      }))
    };
  }


  private async lockExpensesForTrip(tripId: string): Promise<void> {
    // Lock all expenses in this trip
    await this.prisma.expense.updateMany({
      where: { tripId },
      data: { isLocked: true }
    });
  }

  private mapTransactionToResponseDto(t: any): PaymentTransactionResponseDto {
    return {
      id: t.id,
      amount: Number(t.amount),
      status: t.status,
      method: t.method ?? undefined,
      note: t.note ?? undefined,
      createdAt: t.createdAt,
      settlementId: t.settlementId,
      fromUserId: t.fromUserId,
      toUserId: t.toUserId
    };
  }
}

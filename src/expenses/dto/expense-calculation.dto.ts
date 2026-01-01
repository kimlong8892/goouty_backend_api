export class UserBalanceDto {
  userId: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = should receive money, negative = should pay money
  totalReceived: number; // total amount received from successful transactions
  totalPaidOut: number; // total amount paid out from successful transactions
  remaining: number; // net remaining after transactions (positive: still to receive, negative: still to pay)
}

export class PaymentSettlementDto {
  debtorId: string;
  debtor: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  creditorId: string;
  creditor: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  amount: number;
}

export class ExpenseCalculationResponseDto {
  tripId: string;
  totalExpenses: number;
  transactionCount: number;
  userBalances: UserBalanceDto[];
  settlements: PaymentSettlementDto[];
  isBalanced: boolean;
}

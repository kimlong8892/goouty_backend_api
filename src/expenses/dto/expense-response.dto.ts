export class ExpenseParticipantResponseDto {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
  };
  amount: number;
  createdAt: Date;
}

export class UserSummaryDto {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
}

export class ExpenseResponseDto {
  id: string;
  title: string;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  tripId: string;
  payerId: string;

  payer: UserSummaryDto;

  participants: ExpenseParticipantResponseDto[];

  createdBy?: UserSummaryDto;
  lastUpdatedBy?: UserSummaryDto;
}

export class ExpenseListResponseDto {
  id: string;
  title: string;
  amount: number;
  date: Date;
  description?: string;
  isLocked?: boolean;
  createdAt: Date;
  updatedAt: Date;

  tripId: string;
  payerId: string;

  payer: UserSummaryDto;

  participants: ExpenseParticipantResponseDto[];

  createdBy?: UserSummaryDto;
  lastUpdatedBy?: UserSummaryDto;
}

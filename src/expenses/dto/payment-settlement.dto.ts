import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum PaymentSettlementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export class CreatePaymentSettlementDto {
  @IsString()
  tripId: string;

  @IsString()
  debtorId: string;

  @IsString()
  creditorId: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePaymentSettlementDto {
  @IsOptional()
  @IsEnum(PaymentSettlementStatus)
  status?: PaymentSettlementStatus;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PaymentSettlementResponseDto {
  id: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  settledAt?: Date;
  
  tripId: string;
  debtorId: string;
  debtor: {
    id: string;
    email: string;
    fullName: string;
  };
  creditorId: string;
  creditor: {
    id: string;
    email: string;
    fullName: string;
  };
}

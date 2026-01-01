import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export enum PaymentTransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export class CreatePaymentTransactionDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(PaymentTransactionStatus)
  status?: PaymentTransactionStatus;
}

export class PaymentTransactionResponseDto {
  id: string;
  amount: number;
  status: string;
  method?: string;
  note?: string;
  createdAt: Date;

  settlementId: string;
  fromUserId: string;
  toUserId: string;
}



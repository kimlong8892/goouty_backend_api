import { IsString, IsNumber, IsDateString, IsOptional, IsArray, Min, ValidateIf, ArrayMinSize } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  tripId: string;

  @IsString()
  payerId: string;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  // Optional per-participant amounts; if provided, length must equal participantIds and sum equals amount
  @IsOptional()
  @IsArray()
  amounts?: number[];
}

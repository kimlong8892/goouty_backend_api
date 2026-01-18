import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateDayDto {
  @ApiProperty({ description: 'Day title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Day description', required: false })
  @IsString()
  @IsOptional()
  description?: string;



  @ApiProperty({ description: 'Trip ID this day belongs to' })
  @IsString()
  tripId: string;
}

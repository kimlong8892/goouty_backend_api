import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ description: 'Trip title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Province ID for trip destination' })
  @IsOptional()
  @IsUUID()
  provinceId?: string;

  @ApiPropertyOptional({ description: 'Trip start date (ngày đi)', example: '2025-09-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Trip end date (ngày về)', example: '2025-09-25T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Trip description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template ID if trip is created from a template' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  isNotificationOnCreate?: boolean;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsUUID()
  id?: string;
}

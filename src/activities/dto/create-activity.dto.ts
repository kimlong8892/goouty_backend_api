import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateActivityDto {
  @ApiProperty({ description: 'Activity title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Activity start time', example: '2025-09-20T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMin?: number;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Avatar image file',
    type: 'string',
    format: 'binary'
  })
  @IsOptional()
  avatar?: any; // Changed to any to avoid type conflicts, though effectively it's not bound by DTO validation for file uploads

  @ApiPropertyOptional({ description: 'Mark activity as important', default: false })
  @IsOptional()
  // Handle 'true' string from multipart
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  important?: boolean;

  @ApiProperty({ description: 'Day ID' })
  @IsUUID()
  @IsNotEmpty()
  dayId: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isNotificationOnCreate?: boolean;
}

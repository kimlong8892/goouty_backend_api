import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested, IsArray, IsInt, Min, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTripTemplateActivityDto {
  @ApiProperty({ description: 'Activity title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Activity start time (HH:mm format)', example: '09:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Mark activity as important', default: false })
  @IsOptional()
  @IsBoolean()
  important?: boolean;

  @ApiProperty({ description: 'Order of the activity in the day' })
  @IsInt()
  @Min(1)
  activityOrder: number;
}

export class CreateTripTemplateDayDto {
  @ApiProperty({ description: 'Day title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Day description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Order of the day in the template' })
  @IsInt()
  @Min(1)
  dayOrder: number;

  @ApiPropertyOptional({ description: 'Activities for this day', type: [CreateTripTemplateActivityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripTemplateActivityDto)
  activities?: CreateTripTemplateActivityDto[];
}

export class CreateTripTemplateDto {
  @ApiProperty({ description: 'Trip template title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Trip template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Avatar URL for trip template' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Fee for the trip template', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({ description: 'Province ID for trip template destination' })
  @IsOptional()
  @IsUUID()
  provinceId?: string;

  @ApiPropertyOptional({ description: 'Make template public for others to use', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Days for this template', type: [CreateTripTemplateDayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripTemplateDayDto)
  days?: CreateTripTemplateDayDto[];
}

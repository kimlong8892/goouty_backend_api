import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  startTime?: Date;

  @ApiPropertyOptional()
  durationMin?: number;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  important: boolean;

  @ApiProperty()
  dayId: string;
}

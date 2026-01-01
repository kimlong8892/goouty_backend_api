import { ApiProperty } from '@nestjs/swagger';
import { Day } from '@prisma/client';

export class DayResponseDto implements Partial<Day> {
  @ApiProperty({ description: 'Day ID' })
  id: string;

  @ApiProperty({ description: 'Day title' })
  title: string;

  @ApiProperty({ description: 'Day description', required: false })
  description?: string;

  @ApiProperty({ description: 'Day date' })
  date: Date;

  @ApiProperty({ description: 'Day start time', required: false })
  startTime: Date | null;

  @ApiProperty({ description: 'Trip ID this day belongs to' })
  tripId: string;

  @ApiProperty({ description: 'Date when day was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when day was last updated' })
  updatedAt: Date;
}
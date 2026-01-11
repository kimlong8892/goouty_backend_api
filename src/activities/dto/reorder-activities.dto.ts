import { IsArray, IsNotEmpty, IsString, IsInt, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ActivityOrderItemDto {
    @ApiProperty({ description: 'Activity ID' })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({ description: 'New sort order' })
    @IsInt()
    sortOrder: number;
}

export class ReorderActivitiesDto {
    @ApiProperty({ description: 'List of activities with their new sort orders', type: [ActivityOrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ActivityOrderItemDto)
    activities: ActivityOrderItemDto[];
}

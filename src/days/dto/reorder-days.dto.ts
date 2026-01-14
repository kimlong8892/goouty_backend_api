import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderDaysDto {
    @ApiProperty({ description: 'List of day IDs in the desired order', type: [String] })
    @IsArray()
    @IsString({ each: true })
    dayIds: string[];
}

import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
    @ApiProperty({ description: 'Rating stars (1-5)', example: 5 })
    @IsInt()
    @Min(1)
    @Max(5)
    stars: number;

    @ApiProperty({ description: 'Rating content', example: 'Great app!' })
    @IsString()
    @IsNotEmpty()
    content: string;
}

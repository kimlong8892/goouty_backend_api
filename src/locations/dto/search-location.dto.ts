import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchLocationDto {
    @IsString()
    input: string;

    @IsOptional()
    @IsString()
    location?: string; // lat,lng format for proximity search

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(20)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    radius?: string; // radius in meters

    @IsOptional()
    @IsString()
    more_compound?: string; // true/false
}

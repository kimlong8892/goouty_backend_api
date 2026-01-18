import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloneDbDto {
    @ApiProperty({ example: 'localhost', description: 'Database host' })
    @IsString()
    @IsNotEmpty()
    host: string;

    @ApiProperty({ example: 5432, description: 'Database number' })
    @IsNumber()
    @IsNotEmpty()
    port: number;

    @ApiProperty({ example: 'postgres', description: 'Database user' })
    @IsString()
    @IsNotEmpty()
    user: string;

    @ApiProperty({ example: 'password', description: 'Database password' })
    @IsString()
    @IsNotEmpty()
    pass: string;

    @ApiProperty({ example: 'goouty_db', description: 'Database name' })
    @IsString()
    @IsNotEmpty()
    dbName: string;
}

import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CloneDbDto {
    @IsString()
    @IsNotEmpty()
    host: string;

    @IsNumber()
    @IsNotEmpty()
    port: number;

    @IsString()
    @IsNotEmpty()
    user: string;

    @IsString()
    @IsNotEmpty()
    pass: string;

    @IsString()
    @IsNotEmpty()
    dbName: string;
}

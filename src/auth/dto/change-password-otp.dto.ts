import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordOtpDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '1234' })
    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    otp: string;

    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}

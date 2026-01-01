import { IsNotEmpty, MinLength, IsString } from 'class-validator';

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsString()
    token: string;

    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}

import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiPropertyOptional({ description: 'Current password (required only if user has existing password)' })
    @IsOptional()
    @IsString()
    currentPassword?: string;

    @ApiProperty({ description: 'New password' })
    @IsString()
    @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    newPassword: string;

    @ApiProperty({ description: 'Confirm new password' })
    @IsString()
    confirmPassword: string;
}

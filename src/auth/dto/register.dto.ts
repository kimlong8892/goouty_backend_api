import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Vui lòng cung cấp địa chỉ email hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải dài ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of user' })
  @IsString()
  @IsOptional()
  fullName?: string;
}

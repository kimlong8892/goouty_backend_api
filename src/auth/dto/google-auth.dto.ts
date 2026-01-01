import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token from frontend' })
  @IsString()
  @IsNotEmpty()
  credential: string;

  @ApiProperty({ description: 'Google user ID' })
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @ApiProperty({ description: 'User email from Google' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full name from Google' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'User profile picture URL from Google', required: false })
  @IsString()
  @IsOptional()
  picture?: string;
}

export class GoogleAuthResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User full name' })
  fullName: string;

  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Whether this is a new user' })
  isNewUser: boolean;
}

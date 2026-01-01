import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of user', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: '+84123456789', description: 'Phone number', required: false })
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Profile picture URL', required: false })
  @IsUrl({}, { message: 'Please provide a valid URL for profile picture' })
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({ example: 'VCB', description: 'Bank code from predefined list', required: false })
  @IsOptional()
  bankId?: string | null;

  @ApiProperty({ example: '0123456789', description: 'Bank account number', required: false })
  @IsOptional()
  bankNumber?: string | null;
}

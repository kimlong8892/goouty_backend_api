import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribePushDto {
  @ApiProperty({ description: 'Push subscription endpoint' })
  @IsString()
  endpoint: string;

  @ApiProperty({ description: 'Push subscription p256dh key' })
  @IsString()
  p256dh: string;

  @ApiProperty({ description: 'Push subscription auth key' })
  @IsString()
  auth: string;

  @ApiProperty({ description: 'Device ID' })
  @IsString()
  deviceId: string;

  @ApiPropertyOptional({ description: 'Device name' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ description: 'User agent' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable notifications' })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
}

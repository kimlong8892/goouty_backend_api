import { IsString, IsOptional, IsEnum, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  TRIP_CREATED = 'TRIP_CREATED',
  TRIP_UPDATED = 'TRIP_UPDATED',
  TRIP_DELETED = 'TRIP_DELETED',
  EXPENSE_ADDED = 'EXPENSE_ADDED',
  EXPENSE_UPDATED = 'EXPENSE_UPDATED',
  SETTLEMENT_CREATED = 'SETTLEMENT_CREATED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body/message' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ 
    description: 'Notification type',
    enum: NotificationType,
    default: NotificationType.INFO
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType = NotificationType.INFO;

  @ApiPropertyOptional({ description: 'Additional data (URL, metadata, etc.)' })
  @IsOptional()
  @IsObject()
  data?: any;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({ 
    description: 'Notification status',
    enum: NotificationStatus
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ description: 'Additional data' })
  @IsOptional()
  @IsObject()
  data?: any;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification body' })
  body: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Notification status', enum: NotificationStatus })
  status: NotificationStatus;

  @ApiPropertyOptional({ description: 'Additional data' })
  data?: any;

  @ApiPropertyOptional({ description: 'When notification was sent' })
  sentAt?: Date;

  @ApiPropertyOptional({ description: 'When user read the notification' })
  readAt?: Date;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ description: 'List of notifications', type: [NotificationResponseDto] })
  notifications: NotificationResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Unread count' })
  unreadCount: number;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'Notification IDs to mark as read' })
  @IsString({ each: true })
  notificationIds: string[];
}

export class NotificationStatsDto {
  @ApiProperty({ description: 'Total notifications' })
  total: number;

  @ApiProperty({ description: 'Unread notifications' })
  unread: number;

  @ApiProperty({ description: 'Read notifications' })
  read: number;

  @ApiProperty({ description: 'Archived notifications' })
  archived: number;

  @ApiProperty({ description: 'Notifications by type' })
  byType: Record<NotificationType, number>;
}
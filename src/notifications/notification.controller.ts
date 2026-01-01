import { Controller, Post, Body, UseGuards, Request, Get, Put, Delete, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { EnhancedNotificationService } from './enhanced-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscribePushDto, UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  NotificationResponseDto, 
  NotificationListResponseDto,
  NotificationStatsDto,
  MarkAsReadDto,
  NotificationType,
  NotificationStatus
} from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly enhancedNotificationService: EnhancedNotificationService
  ) {}

  @Post('test-all-devices')
  @ApiOperation({ summary: 'Send test notification to all devices' })
  @ApiResponse({ status: 200, description: 'Test notification sent to all devices' })
  async sendTestNotificationToAllDevices(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.sendTestNotificationToAllDevices(userId);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe user to push notifications' })
  @ApiResponse({ status: 200, description: 'User subscribed successfully' })
  async subscribeToPush(
    @Request() req,
    @Body() subscribePushDto: SubscribePushDto,
  ) {
    // Store push subscription in database
    const subscriptionData = JSON.stringify({
      endpoint: subscribePushDto.endpoint,
      keys: {
        p256dh: subscribePushDto.p256dh,
        auth: subscribePushDto.auth,
      }
    });

    // Get userId from request
    const userId = req.user.userId;
    console.log('User ID from request:', userId);
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    // Update user notification preferences
    await this.notificationService.updateUserNotificationPreferences(userId, {
      notificationsEnabled: true,
    });

    // Register/update device with push subscription if device info is provided
    if (subscribePushDto.deviceId) {
      await this.notificationService.registerDeviceWithPushSubscription(
        userId,
        {
          deviceId: subscribePushDto.deviceId,
          deviceName: subscribePushDto.deviceName,
          userAgent: subscribePushDto.userAgent,
          pushSubscription: subscriptionData,
        }
      );
    }

    return {
      success: true,
      message: 'Push subscription saved and device registered',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get complete notification status' })
  @ApiResponse({ status: 200, description: 'Notification status retrieved' })
  async getNotificationStatus(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.getCompleteNotificationStatus(userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'User notification preferences retrieved' })
  async getNotificationPreferences(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.getUserNotificationPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'User notification preferences updated' })
  async updateNotificationPreferences(
    @Request() req,
    @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.updateUserNotificationPreferences(
      userId,
      updatePreferencesDto
    );
  }

  @Get('test')
  @ApiOperation({ summary: 'Test notification endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testNotification() {
    return {
      success: true,
      message: 'Notification API is working',
      timestamp: new Date(),
    };
  }

  // ==================== NOTIFICATION CRUD APIs ====================

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully', type: NotificationResponseDto })
  async createNotification(
    @Request() req,
    @Body() createNotificationDto: CreateNotificationDto
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.createNotification(userId, createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully', type: NotificationListResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filter by type' })
  async getUserNotifications(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.getUserNotifications(userId, page, limit, status, type);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: NotificationStatsDto })
  async getNotificationStats(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.getNotificationStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully', type: NotificationResponseDto })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async getNotificationById(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.getNotificationById(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update notification' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully', type: NotificationResponseDto })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async updateNotification(
    @Request() req,
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.updateNotification(id, userId, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async deleteNotification(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    await this.notificationService.deleteNotification(id, userId);
    return { message: 'Notification deleted successfully' };
  }

  @Post('mark-as-read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markAsRead(@Request() req, @Body() markAsReadDto: MarkAsReadDto) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.markAsRead(userId, markAsReadDto);
  }

  @Post('mark-all-as-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete('clear-read')
  @ApiOperation({ summary: 'Clear all read notifications' })
  @ApiResponse({ status: 200, description: 'Read notifications cleared' })
  async clearReadNotifications(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.notificationService.clearReadNotifications(userId);
  }

  // ==================== SEND NOTIFICATION APIs ====================

  @Post('send-to-user')
  @ApiOperation({ summary: 'Send notification to specific user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotificationToUser(
    @Request() req,
    @Body() body: {
      title: string;
      body: string;
      type?: string;
      data?: any;
    }
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.notificationService.sendNotificationToUserDevices(
      userId,
      body.title,
      body.body,
      body.type as any || 'INFO',
      body.data
    );
  }

  @Post('send-with-database')
  @ApiOperation({ summary: 'Send notification and save to database' })
  @ApiResponse({ status: 200, description: 'Notification sent and saved successfully' })
  async sendNotificationWithDatabase(
    @Request() req,
    @Body() body: {
      title: string;
      body: string;
      type?: string;
      data?: any;
      pushSubscription?: any;
    }
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.notificationService.sendNotificationWithDatabase(
      userId,
      body.title,
      body.body,
      body.type as any || 'INFO',
      body.data,
      body.pushSubscription
    );
  }

  // ==================== ENHANCED NOTIFICATION APIs ====================

  @Post('system-announcement')
  @ApiOperation({ summary: 'Send system announcement to all users' })
  @ApiResponse({ status: 200, description: 'System announcement sent successfully' })
  async sendSystemAnnouncement(
    @Request() req,
    @Body() body: {
      message: string;
      skipEmail?: boolean;
      skipPush?: boolean;
    }
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.enhancedNotificationService.sendSystemAnnouncement(
      body.message,
      {
        skipEmail: body.skipEmail,
        skipPush: body.skipPush
      }
    );
  }

  @Post('custom-notification')
  @ApiOperation({ summary: 'Send custom notification to specific users' })
  @ApiResponse({ status: 200, description: 'Custom notification sent successfully' })
  async sendCustomNotification(
    @Request() req,
    @Body() body: {
      type: string;
      context: any;
      userIds: string[];
      skipEmail?: boolean;
      skipPush?: boolean;
    }
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.enhancedNotificationService.sendCustomNotification(
      body.type,
      body.context,
      body.userIds,
      {
        skipEmail: body.skipEmail,
        skipPush: body.skipPush
      }
    );
  }
}

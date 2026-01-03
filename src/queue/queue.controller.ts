import { Controller, Get, Post, Delete, Body, Logger, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { QueueService } from './queue.service';
import { EnhancedNotificationService } from '../notifications/enhanced-notification.service';

@ApiTags('Queue Management')
@Controller('queue')
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly enhancedNotificationService: EnhancedNotificationService,
  ) { }

  @Get('health')
  @ApiOperation({ summary: 'Check queue health and connection' })
  @ApiResponse({ status: 200, description: 'Queue health check' })
  async checkQueueHealth() {
    try {
      const stats = await this.queueService.getQueueStats();
      return {
        status: 'healthy',
        message: 'Queue is working properly',
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Queue connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully' })
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  @Post('pause')
  @ApiOperation({ summary: 'Pause all notification queues' })
  @ApiResponse({ status: 200, description: 'All queues paused successfully' })
  async pauseAllQueues() {
    await this.queueService.pauseAllQueues();
    return { message: 'All queues paused successfully' };
  }

  @Post('resume')
  @ApiOperation({ summary: 'Resume all notification queues' })
  @ApiResponse({ status: 200, description: 'All queues resumed successfully' })
  async resumeAllQueues() {
    await this.queueService.resumeAllQueues();
    return { message: 'All queues resumed successfully' };
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all jobs from all queues' })
  @ApiResponse({ status: 200, description: 'All queues cleared successfully' })
  async clearAllQueues() {
    await this.queueService.clearAllQueues();
    return { message: 'All queues cleared successfully' };
  }

  @Post('test')
  @ApiOperation({ summary: 'Test queue functionality' })
  @ApiResponse({ status: 200, description: 'Test job added successfully' })
  async testQueue(@Body() body: { userId: string }) {
    const testJob = {
      type: 'test_notification',
      context: {
        message: 'Test notification from queue',
        timestamp: new Date().toISOString()
      },
      userId: body.userId,
      options: {
        skipEmail: true,
        skipPush: false
      }
    };

    const result = await this.queueService.addSystemNotificationJob(testJob);
    return {
      message: 'Test job added successfully',
      jobId: result.id,
      jobData: testJob
    };
  }

  @Post('process')
  @ApiOperation({ summary: 'Process a job from Cloud Tasks' })
  @ApiResponse({ status: 200, description: 'Job processed successfully' })
  async processJob(@Body() data: any, @Req() req: Request) {
    this.logger.log('--- Cloud Task Webhook Received ---');
    this.logger.log(`URL: ${req.url}`);
    this.logger.log(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.log(`Body Type: ${typeof data}`);
    this.logger.log(`Body Keys: ${Object.keys(data || {})}`);

    if (!data || Object.keys(data).length === 0) {
      this.logger.error('Received empty body from Cloud Task');
      return { success: false, message: 'Empty body' };
    }

    this.logger.log(`Processing job for user ${data.userId}, type ${data.type}`);

    try {
      const result = await this.enhancedNotificationService.processNotificationJob(data);
      this.logger.log(`Job processed result: ${JSON.stringify(result)}`);

      if (result && (result as any).success === false) {
        // If it failed but it's a "permanent" failure (e.g. user not found), 
        // return 200 so Cloud Tasks doesn't retry forever.
        this.logger.warn(`Job failed but returning 200 for Google Cloud Tasks: ${JSON.stringify(result)}`);
        return result;
      }

      return result;
    } catch (error) {
      this.logger.error(`Error processing Cloud Task job: ${error.message}`, error.stack);
      // Throwing error here will make Cloud Tasks retry. 
      // Notifications should normally be retried if it was a network error.
      throw error;
    }
  }
}

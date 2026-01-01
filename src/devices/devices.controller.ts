import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DevicesService, CreateDeviceDto, UpdateDeviceDto } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Tạo hoặc cập nhật thiết bị cho user hiện tại
   */
  @Post()
  async createOrUpdateDevice(@Request() req, @Body() createDeviceDto: CreateDeviceDto) {
    const userId = req.user.userId;
    console.log('Device registration - User ID:', userId);
    return this.devicesService.createOrUpdateDevice(userId, createDeviceDto);
  }

  /**
   * Lấy tất cả thiết bị của user hiện tại
   */
  @Get()
  async getUserDevices(@Request() req) {
    const userId = req.user.userId;
    return this.devicesService.getUserDevices(userId);
  }

  /**
   * Lấy tất cả thiết bị có push subscription của user hiện tại
   */
  @Get('push-subscriptions')
  async getUserDevicesWithPushSubscription(@Request() req) {
    const userId = req.user.userId;
    return this.devicesService.getUserDevicesWithPushSubscription(userId);
  }

  /**
   * Cập nhật push subscription cho thiết bị cụ thể
   */
  @Put(':deviceId/push-subscription')
  async updateDevicePushSubscription(
    @Request() req,
    @Param('deviceId') deviceId: string,
    @Body() body: { pushSubscription: string },
  ) {
    const userId = req.user.userId;
    return this.devicesService.updateDevicePushSubscription(userId, deviceId, body.pushSubscription);
  }

  /**
   * Cập nhật thông tin thiết bị
   */
  @Put(':deviceId')
  async updateDevice(
    @Request() req,
    @Param('deviceId') deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    const userId = req.user.userId;
    // Implement update logic if needed
    return { message: 'Device updated successfully' };
  }

  /**
   * Vô hiệu hóa thiết bị
   */
  @Delete(':deviceId')
  async deactivateDevice(@Request() req, @Param('deviceId') deviceId: string) {
    const userId = req.user.userId;
    return this.devicesService.deactivateDevice(userId, deviceId);
  }

  /**
   * Cập nhật thời gian lastSeen
   */
  @Put(':deviceId/last-seen')
  async updateLastSeen(@Request() req, @Param('deviceId') deviceId: string) {
    const userId = req.user.userId;
    await this.devicesService.updateLastSeen(userId, deviceId);
    return { message: 'Last seen updated successfully' };
  }
}

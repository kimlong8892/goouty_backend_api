import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateDeviceDto {
  deviceId: string;
  deviceName?: string;
  userAgent?: string;
  pushSubscription?: string;
}

export interface UpdateDeviceDto {
  deviceName?: string;
  pushSubscription?: string;
  isActive?: boolean;
}

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo hoặc cập nhật thiết bị cho user
   */
  async createOrUpdateDevice(userId: string, deviceData: CreateDeviceDto) {
    try {
      const device = await this.prisma.device.upsert({
        where: {
          userId_deviceId: {
            userId,
            deviceId: deviceData.deviceId,
          },
        },
        update: {
          deviceName: deviceData.deviceName,
          userAgent: deviceData.userAgent,
          pushSubscription: deviceData.pushSubscription,
          isActive: true,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
        create: {
          userId,
          deviceId: deviceData.deviceId,
          deviceName: deviceData.deviceName,
          userAgent: deviceData.userAgent,
          pushSubscription: deviceData.pushSubscription,
          isActive: true,
        },
      });

      console.log(`Device created/updated for user ${userId}:`, device.id);
      return device;
    } catch (error) {
      console.error('Error creating/updating device:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả thiết bị của user
   */
  async getUserDevices(userId: string) {
    try {
      const devices = await this.prisma.device.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          lastSeen: 'desc',
        },
      });

      return devices;
    } catch (error) {
      console.error('Error getting user devices:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả thiết bị có push subscription của user
   */
  async getUserDevicesWithPushSubscription(userId: string) {
    try {
      const devices = await this.prisma.device.findMany({
        where: {
          userId,
          isActive: true,
          pushSubscription: {
            not: null,
          },
        },
        orderBy: {
          lastSeen: 'desc',
        },
      });

      return devices;
    } catch (error) {
      console.error('Error getting user devices with push subscription:', error);
      throw error;
    }
  }

  /**
   * Cập nhật push subscription cho thiết bị
   */
  async updateDevicePushSubscription(
    userId: string,
    deviceId: string,
    pushSubscription: string,
  ) {
    try {
      const device = await this.prisma.device.updateMany({
        where: {
          userId,
          deviceId,
          isActive: true,
        },
        data: {
          pushSubscription,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`Push subscription updated for device ${deviceId} of user ${userId}`);
      return device;
    } catch (error) {
      console.error('Error updating device push subscription:', error);
      throw error;
    }
  }

  /**
   * Vô hiệu hóa thiết bị
   */
  async deactivateDevice(userId: string, deviceId: string) {
    try {
      const device = await this.prisma.device.updateMany({
        where: {
          userId,
          deviceId,
        },
        data: {
          isActive: false,
          pushSubscription: null,
          updatedAt: new Date(),
        },
      });

      console.log(`Device ${deviceId} deactivated for user ${userId}`);
      return device;
    } catch (error) {
      console.error('Error deactivating device:', error);
      throw error;
    }
  }

  /**
   * Xóa thiết bị
   */
  async deleteDevice(userId: string, deviceId: string) {
    try {
      const device = await this.prisma.device.deleteMany({
        where: {
          userId,
          deviceId,
        },
      });

      console.log(`Device ${deviceId} deleted for user ${userId}`);
      return device;
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thời gian lastSeen cho thiết bị
   */
  async updateLastSeen(userId: string, deviceId: string) {
    try {
      await this.prisma.device.updateMany({
        where: {
          userId,
          deviceId,
          isActive: true,
        },
        data: {
          lastSeen: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating last seen:', error);
      // Không throw error vì đây là operation không critical
    }
  }

  /**
   * Lấy tất cả thiết bị có push subscription của tất cả users
   */
  async getAllDevicesWithPushSubscription() {
    try {
      const devices = await this.prisma.device.findMany({
        where: {
          isActive: true,
          pushSubscription: {
            not: null,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              notificationsEnabled: true,
            },
          },
        },
        orderBy: {
          lastSeen: 'desc',
        },
      });

      return devices;
    } catch (error) {
      console.error('Error getting all devices with push subscription:', error);
      throw error;
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesRepository } from './activities.repository';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly uploadService: UploadService
  ) { }

  async create(createActivityDto: CreateActivityDto, file?: Express.Multer.File) {
    const { dayId, ...activityData } = createActivityDto;

    let avatarUrl = activityData.avatar;
    if (file) {
      const uploadResult = await this.uploadService.uploadImage(file, {
        folder: 'activities/avatars',
        acl: 'public-read'
      });
      avatarUrl = uploadResult.url;
    }

    // Get the last activity to determine the next sortOrder
    const lastActivity = await this.activitiesRepository.findLastByDay(dayId);
    const sortOrder = lastActivity ? (lastActivity.sortOrder || 0) + 1 : 0;

    return this.activitiesRepository.create({
      ...activityData,
      avatar: avatarUrl,
      sortOrder,
      startTime: createActivityDto.startTime ? new Date(createActivityDto.startTime) : null,
      day: { connect: { id: dayId } }
    });
  }

  async findAll(dayId: string) {
    return this.activitiesRepository.findAll({
      where: { dayId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async findOne(id: string) {
    const activity = await this.activitiesRepository.findOne(id);
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto, file?: Express.Multer.File) {
    // Check if activity exists
    const activity = await this.findOne(id);

    const data: any = { ...updateActivityDto };

    if (file) {
      const uploadResult = await this.uploadService.uploadImage(file, {
        folder: 'activities/avatars',
        acl: 'public-read'
      });
      data.avatar = uploadResult.url;

      // Ideally delete old avatar if it exists, but optional
      // if (activity.avatar) { ... }
    }

    if (updateActivityDto.startTime) {
      data.startTime = new Date(updateActivityDto.startTime);
    }

    if (updateActivityDto.dayId) {
      data.day = { connect: { id: updateActivityDto.dayId } };
      delete data.dayId;
    }

    return this.activitiesRepository.update(id, data);
  }

  async remove(id: string) {
    // Check if activity exists
    await this.findOne(id);

    return this.activitiesRepository.remove(id);
  }

  async reorder(reorderActivitiesDto: ReorderActivitiesDto) {
    return this.activitiesRepository.reorder(reorderActivitiesDto.activities);
  }

}

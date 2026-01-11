import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesRepository } from './activities.repository';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activitiesRepository: ActivitiesRepository
  ) { }

  async create(createActivityDto: CreateActivityDto) {
    const { dayId, ...activityData } = createActivityDto;

    // Get the last activity to determine the next sortOrder
    const lastActivity = await this.activitiesRepository.findLastByDay(dayId);
    const sortOrder = lastActivity ? (lastActivity.sortOrder || 0) + 1 : 0;

    return this.activitiesRepository.create({
      ...activityData,
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

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    // Check if activity exists
    await this.findOne(id);

    const data: any = { ...updateActivityDto };

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

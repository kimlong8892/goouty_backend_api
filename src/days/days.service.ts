import { Injectable, NotFoundException } from '@nestjs/common';
import { DaysRepository } from './days.repository';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';
import { ReorderDaysDto } from './dto/reorder-days.dto';

@Injectable()
export class DaysService {
  constructor(private readonly daysRepository: DaysRepository) { }

  async create(createDayDto: CreateDayDto) {
    const { tripId, ...dayData } = createDayDto;

    const maxOrder = await this.daysRepository.findMaxOrder(tripId);
    return this.daysRepository.create({
      ...dayData,
      order: maxOrder + 1,
      trip: { connect: { id: tripId } }
    });
  }

  async findAll(tripId: string) {
    return this.daysRepository.findAll({
      where: { tripId },
      orderBy: { order: 'asc' }
    });
  }

  async findOne(id: string) {
    const day = await this.daysRepository.findOne(id);
    if (!day) {
      throw new NotFoundException(`Day with ID ${id} not found`);
    }
    return day;
  }

  async update(id: string, updateDayDto: UpdateDayDto) {
    // Check if day exists
    await this.findOne(id);

    const data: any = { ...updateDayDto };



    if (updateDayDto.tripId) {
      data.trip = { connect: { id: updateDayDto.tripId } };
      delete data.tripId;
    }

    return this.daysRepository.update(id, data);
  }

  async remove(id: string) {
    // Check if day exists
    await this.findOne(id);
    return this.daysRepository.remove(id);
  }

  async reorder(reorderDaysDto: ReorderDaysDto) {
    const items = reorderDaysDto.dayIds.map((id, index) => ({
      id,
      order: index,
    }));
    await this.daysRepository.reorder(items);
    return { success: true };
  }
}

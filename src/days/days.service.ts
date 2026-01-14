import { Injectable, NotFoundException } from '@nestjs/common';
import { DaysRepository } from './days.repository';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';

@Injectable()
export class DaysService {
  constructor(private readonly daysRepository: DaysRepository) { }

  async create(createDayDto: CreateDayDto) {
    const { tripId, ...dayData } = createDayDto;

    return this.daysRepository.create({
      ...dayData,
      // "date" now includes time component
      date: new Date(createDayDto.date),
      trip: { connect: { id: tripId } }
    });
  }

  async findAll(tripId: string) {
    return this.daysRepository.findAll({
      where: { tripId },
      orderBy: { createdAt: 'asc' }
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

    if (updateDayDto.date) {
      // "date" now includes time component
      data.date = new Date(updateDayDto.date);
    }

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
}

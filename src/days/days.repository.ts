import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Day, Prisma } from '@prisma/client';

@Injectable()
export class DaysRepository {
  constructor(private prisma: PrismaService) { }

  async create(data: Prisma.DayCreateInput): Promise<Day> {
    return this.prisma.day.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DayWhereInput;
    orderBy?: Prisma.DayOrderByWithRelationInput;
  }): Promise<Day[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.day.findMany({ skip, take, where, orderBy });
  }

  async findOne(id: string): Promise<Day | null> {
    return this.prisma.day.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async update(id: string, data: Prisma.DayUpdateInput): Promise<Day> {
    return this.prisma.day.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Day> {
    return this.prisma.day.delete({ where: { id } });
  }
}

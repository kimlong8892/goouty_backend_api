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
    orderBy?: Prisma.DayOrderByWithRelationInput | Prisma.DayOrderByWithRelationInput[];
  }): Promise<Day[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.day.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        },
        lastUpdatedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        }
      }
    });
  }

  async findOne(id: string): Promise<Day | null> {
    return this.prisma.day.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { sortOrder: 'asc' }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        },
        lastUpdatedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
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

  async reorder(items: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.day.update({
          where: { id: item.id },
          data: { sortOrder: item.order },
        }),
      ),
    );
  }

  async count(where: Prisma.DayWhereInput): Promise<number> {
    return this.prisma.day.count({ where });
  }

  async findMaxOrder(tripId: string): Promise<number> {
    const result = await this.prisma.day.findFirst({
      where: { tripId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return result?.sortOrder ?? -1;
  }
}

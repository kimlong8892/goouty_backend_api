import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Activity, Prisma } from '@prisma/client';

@Injectable()
export class ActivitiesRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ActivityCreateInput): Promise<Activity> {
    return this.prisma.activity.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ActivityWhereInput;
    orderBy?: Prisma.ActivityOrderByWithRelationInput;
    include?: Prisma.ActivityInclude;
  }): Promise<any[]> {
    const { skip, take, where, orderBy, include } = params;
    return this.prisma.activity.findMany({ skip, take, where, orderBy, include });
  }

  async findOne(id: string, options?: { include?: Prisma.ActivityInclude }): Promise<any> {
    return this.prisma.activity.findUnique({ 
      where: { id },
      include: options?.include
    });
  }

  async update(id: string, data: Prisma.ActivityUpdateInput): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Activity> {
    return this.prisma.activity.delete({ where: { id } });
  }
}

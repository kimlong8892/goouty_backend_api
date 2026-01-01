import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Province, Prisma } from '@prisma/client';
import { GetProvincesQueryDto } from './dto/get-provinces-query.dto';

@Injectable()
export class ProvincesRepository {
  constructor(private prisma: PrismaService) {}

  async findAllProvinces(query: GetProvincesQueryDto): Promise<Province[]> {
    const where: Prisma.ProvinceWhereInput = {};

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.divisionType) {
      where.divisionType = query.divisionType;
    }

    return this.prisma.province.findMany({
      where,
      orderBy: {
        code: 'asc',
      },
    });
  }

  async findProvinceById(id: string): Promise<Province | null> {
    return this.prisma.province.findUnique({
      where: { id },
    });
  }

  async findProvinceByCode(code: number): Promise<Province | null> {
    return this.prisma.province.findUnique({
      where: { code },
    });
  }
}

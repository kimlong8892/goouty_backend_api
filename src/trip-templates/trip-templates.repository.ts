import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripTemplateDto } from './dto/create-trip-template.dto';
import { UpdateTripTemplateDto } from './dto/update-trip-template.dto';
import { GetTripTemplatesQueryDto } from './dto/get-trip-templates-query.dto';

@Injectable()
export class TripTemplatesRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateTripTemplateDto) {
    return this.prisma.tripTemplate.create({
      data: {
        title: data.title,
        description: data.description,
        avatar: data.avatar,
        fee: data.fee || 0,
        province: data.provinceId ? { connect: { id: data.provinceId } } : undefined,
        isPublic: data.isPublic || false,
        days: data.days ? {
          create: data.days.map(day => ({
            title: day.title,
            description: day.description,
            dayOrder: day.dayOrder,
            activities: day.activities ? {
              create: day.activities.map(activity => ({
                title: activity.title,
                startTime: activity.startTime,
                durationMin: activity.durationMin,
                location: activity.location,
                notes: activity.notes,
                important: activity.important || false,
                activityOrder: activity.activityOrder,
              }))
            } : undefined
          }))
        } : undefined
      },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
            divisionType: true,
            codename: true,
            phoneCode: true
          }
        },
        days: {
          include: {
            activities: {
              orderBy: { activityOrder: 'asc' }
            }
          },
          orderBy: { dayOrder: 'asc' }
        }
      }
    });
  }

  async findAll(options?: {
    isPublic?: boolean;
    search?: string;
    provinceId?: string;
    page?: number;
    limit?: number
  }) {
    const { isPublic, search, provinceId, page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {};

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (provinceId) {
      where.provinceId = provinceId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { province: { name: { contains: search, mode: 'insensitive' as const } } }
      ];
    }

    const [templates, total] = await Promise.all([
      this.prisma.tripTemplate.findMany({
        where,
        include: {
          province: {
            select: {
              id: true,
              name: true,
              code: true,
              divisionType: true,
              codename: true,
              phoneCode: true
            }
          },
          days: {
            include: {
              activities: {
                orderBy: { activityOrder: 'asc' }
              }
            },
            orderBy: { dayOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.tripTemplate.count({ where })
    ]);

    return {
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    return this.prisma.tripTemplate.findUnique({
      where: { id },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
            divisionType: true,
            codename: true,
            phoneCode: true
          }
        },
        days: {
          include: {
            activities: {
              orderBy: { activityOrder: 'asc' }
            }
          },
          orderBy: { dayOrder: 'asc' }
        }
      }
    });
  }

  async update(id: string, data: UpdateTripTemplateDto) {
    return this.prisma.tripTemplate.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        province: data.provinceId ? { connect: { id: data.provinceId } } : undefined,
        isPublic: data.isPublic,
        fee: data.fee,
        // Note: Updating days and activities would require more complex logic
        // For now, we'll handle this separately
      },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
            divisionType: true,
            codename: true,
            phoneCode: true
          }
        },
        days: {
          include: {
            activities: {
              orderBy: { activityOrder: 'asc' }
            }
          },
          orderBy: { dayOrder: 'asc' }
        }
      }
    });
  }

  async remove(id: string) {
    return this.prisma.tripTemplate.delete({
      where: { id }
    });
  }

  async findPublicTemplates(query: GetTripTemplatesQueryDto) {
    return this.findAll({
      isPublic: true,
      search: query.search,
      provinceId: query.provinceId,
      page: query.page,
      limit: query.limit
    });
  }

  async findUserTemplates(options?: { search?: string; page?: number; limit?: number }) {
    return this.findAll({
      ...options
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Trip, Prisma } from '@prisma/client';

@Injectable()
export class TripsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TripCreateInput): Promise<Trip> {
    return this.prisma.trip.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.TripWhereInput;
    orderBy?: Prisma.TripOrderByWithRelationInput;
  }): Promise<Trip[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.trip.findMany({ 
      skip, 
      take, 
      where, 
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        },
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
            activities: true
          }
        },
        members: {
          where: {
            status: 'accepted' // Chỉ include những members đã accepted
          },
          select: {
            id: true,
            userId: true,
            tripId: true,
            status: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });
  }

  async findOne(id: string): Promise<Trip | null> {
    return this.prisma.trip.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true
          }
        },
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
            activities: true
          }
        }
      }
    });
  }

  async update(id: string, data: Prisma.TripUpdateInput): Promise<Trip> {
    return this.prisma.trip.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Trip> {
    return this.prisma.trip.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { GetRatingsQueryDto } from './dto/get-ratings-query.dto';

@Injectable()
export class RatingsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, createRatingDto: CreateRatingDto) {
        return this.prisma.rating.create({
            data: {
                stars: createRatingDto.stars,
                content: createRatingDto.content,
                userId: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePicture: true,
                    },
                },
            },
        });
    }

    async findAll(query: GetRatingsQueryDto) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const [ratings, total] = await Promise.all([
            this.prisma.rating.findMany({
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            profilePicture: true,
                        },
                    },
                },
            }),
            this.prisma.rating.count(),
        ]);

        return {
            data: ratings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloneDbDto } from './dto/clone-db.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MigrationService {
    private readonly logger = new Logger(MigrationService.name);

    constructor(private prisma: PrismaService) { }

    async cloneData(dto: CloneDbDto) {
        // Construct basic PostgreSQL connection string
        const encodedPass = encodeURIComponent(dto.pass);
        const connectionString = `postgresql://${dto.user}:${encodedPass}@${dto.host}:${dto.port}/${dto.dbName}`;

        const sourceClient = new PrismaClient({
            datasources: {
                db: {
                    url: connectionString,
                },
            },
        });

        try {
            this.logger.log('Connecting to source database...');
            await sourceClient.$connect();

            const results = {
                templates: 0,
                users: 0,
                trips: 0,
            };

            // 1. Clone Templates
            this.logger.log('Cloning Templates...');
            const templates = await sourceClient.template.findMany();
            for (const t of templates) {
                await this.prisma.template.upsert({
                    where: { code: t.code },
                    update: t,
                    create: t,
                });
                results.templates++;
            }

            // 2. Clone Trips (Complex part)
            this.logger.log('Fetching Trips from source...');
            const sourceTrips = await sourceClient.trip.findMany({
                include: {
                    days: {
                        include: {
                            activities: true,
                        },
                    },
                    members: true,
                },
            });

            // 3. Clone Users involved in these trips first (to avoid FK errors)
            this.logger.log('Cloning relevant Users...');
            const userIds = new Set<string>();

            sourceTrips.forEach(trip => {
                userIds.add(trip.userId); // Owner
                trip.members.forEach(m => {
                    if (m.userId) userIds.add(m.userId);
                });
            });

            const sourceUsers = await sourceClient.user.findMany({
                where: { id: { in: Array.from(userIds) } },
            });

            for (const user of sourceUsers) {
                // Upsert users (preserve existing data if matched by email or ID)
                // Note: Password hashes might be different, but we prioritize keeping existing local users if they conflict
                const existingUser = await this.prisma.user.findUnique({ where: { id: user.id } });
                if (!existingUser) {
                    await this.prisma.user.create({ data: user });
                    results.users++;
                }
            }

            // 4. Insert Trips
            this.logger.log('Inserting Trips...');
            for (const trip of sourceTrips) {
                const { days, members, ...tripData } = trip;

                const existingTrip = await this.prisma.trip.findUnique({ where: { id: trip.id } });
                if (existingTrip) {
                    this.logger.log(`Skipping trip ${trip.title} (ID: ${trip.id}) as it already exists.`);
                    continue;
                }

                await this.prisma.trip.create({
                    data: {
                        ...tripData,
                        days: {
                            create: days.map(day => ({
                                ...day,
                                activities: {
                                    create: day.activities
                                }
                            }))
                        },
                        members: {
                            create: members.map(m => ({
                                ...m,
                                user: undefined // Remove user object relation, only keep userId FK
                            }))
                        }
                    }
                });
                results.trips++;
            }

            this.logger.log('Clone completed successfully');
            return { success: true, imported: results };

        } catch (error) {
            this.logger.error('Error executing clone:', error);
            throw new BadRequestException(`Failed to clone data: ${(error as Error).message}`);
        } finally {
            await sourceClient.$disconnect();
        }
    }
}

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

            // 3. Clone Users involved and map IDs (Source ID -> Target ID)
            this.logger.log('Cloning relevant Users and mapping IDs...');
            const userIds = new Set<string>();
            const userIdMap = new Map<string, string>(); // Source ID -> Target ID

            sourceTrips.forEach(trip => {
                if (trip.userId) userIds.add(trip.userId); // Owner
                trip.members.forEach(m => {
                    if (m.userId) userIds.add(m.userId);
                });
            });

            const sourceUsers = await sourceClient.user.findMany({
                where: { id: { in: Array.from(userIds) } },
            });

            for (const srcUser of sourceUsers) {
                // Find existing user by EMAIL in target DB
                let targetUser = await this.prisma.user.findUnique({
                    where: { email: srcUser.email }
                });

                if (!targetUser) {
                    // Create new user if not exists (using source data, but generate new ID)
                    // We remove id to let Prisma/DB generate it or we can set it if we really want to preserve it and it doesn't conflict
                    // ideally we let the system generate a new ID to avoid PK collisions if UUIDs are used differently
                    const { id, ...userData } = srcUser;
                    targetUser = await this.prisma.user.create({
                        data: {
                            ...userData,
                            // Ensure unique constraints if any other than ID/Email are handled
                        }
                    });
                    results.users++;
                }

                // Map Source ID to Target ID
                userIdMap.set(srcUser.id, targetUser.id);
            }

            // 4. Insert Trips with mapped User IDs
            this.logger.log('Inserting Trips...');
            for (const trip of sourceTrips) {
                const { days, members, ...tripData } = trip;

                // Map the trip owner ID
                const newOwnerId = userIdMap.get(trip.userId);
                if (!newOwnerId) {
                    this.logger.warn(`Skipping trip ${trip.title} because owner (Source ID: ${trip.userId}) could not be mapped (Email not found?).`);
                    continue;
                }

                // Check existence by ID (we assume we keep trip IDs, or handle collision)
                // If we want to strictly keep Trip IDs, we check. 
                const existingTrip = await this.prisma.trip.findUnique({ where: { id: trip.id } });
                if (existingTrip) {
                    this.logger.log(`Skipping trip ${trip.title} (ID: ${trip.id}) as it already exists.`);
                    continue;
                }

                await this.prisma.trip.create({
                    data: {
                        ...tripData,
                        userId: newOwnerId, // Use mapped ID
                        days: {
                            create: days.map(day => {
                                const { tripId, ...dayData } = day; // remove tripId
                                return {
                                    ...dayData,
                                    activities: {
                                        create: day.activities.map(act => {
                                            const { dayId, ...actData } = act; // remove dayId
                                            return actData;
                                        })
                                    }
                                };
                            })
                        },
                        members: {
                            create: members.map(m => {
                                const mappedMemberUserId = m.userId ? userIdMap.get(m.userId) : null;
                                const { tripId, ...memberData } = m; // remove tripId
                                return {
                                    ...memberData,
                                    userId: mappedMemberUserId, // Use mapped ID or null
                                    user: undefined
                                };
                            })
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

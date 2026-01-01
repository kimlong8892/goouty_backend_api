import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';

export class TestApp {
    app: INestApplication;
    accessToken: string;
    userId: string;
    testEmail: string;
    testPassword = 'password123';
    testFullName = 'Test User';
    prisma: PrismaService;

    static async create(): Promise<TestApp> {
        const testApp = new TestApp();
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        testApp.app = moduleFixture.createNestApplication();
        testApp.app.useGlobalPipes(new ValidationPipe());
        testApp.prisma = moduleFixture.get<PrismaService>(PrismaService);

        // Generate unique email for this test instance
        testApp.testEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;

        await testApp.app.init();

        // Register test user
        try {
            const authService = moduleFixture.get<AuthService>(AuthService);
            const result = await authService.register({
                email: testApp.testEmail,
                password: testApp.testPassword,
                fullName: testApp.testFullName
            });

            testApp.accessToken = result.accessToken;
            testApp.userId = result.id;
        } catch (error) {
            // If user already exists, try to login instead
            if (error.message === 'Email already registered') {
                const authService = moduleFixture.get<AuthService>(AuthService);
                const result = await authService.login({
                    email: testApp.testEmail,
                    password: testApp.testPassword
                });

                testApp.accessToken = result.accessToken;
                testApp.userId = result.id;
            } else {
                throw error;
            }
        }

        return testApp;
    }

    private getHttpServer() {
        return this.app.getHttpServer();
    }

    getRequest() {
        return this.authRequest(this.getHttpServer(), this.accessToken);
    }

    getRequestWithToken(token: string) {
        return this.authRequest(this.getHttpServer(), token);
    }

    getPublicRequest() {
        return request(this.getHttpServer());
    }

    getPrisma(): PrismaService {
        return this.prisma;
    }

    async close() {
        await this.prisma.$disconnect();
        return this.app.close();
    }

    private authRequest(server, token) {
        return {
            get: (url) => request(server).get(url).set('Authorization', `Bearer ${token}`),
            post: (url) => request(server).post(url).set('Authorization', `Bearer ${token}`),
            patch: (url) => request(server).patch(url).set('Authorization', `Bearer ${token}`),
            delete: (url) => request(server).delete(url).set('Authorization', `Bearer ${token}`),
            put: (url) => request(server).put(url).set('Authorization', `Bearer ${token}`)
        };
    }

    // Helper methods for creating test data
    async createUser(email?: string, password?: string, fullName?: string) {
        const userEmail = email || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
        const userPassword = password || 'password123';
        const userName = fullName || 'Test User';

        // Hash password like in real app
        const hashedPassword = await bcrypt.hash(userPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                email: userEmail,
                password: hashedPassword,
                fullName: userName
            }
        });

        // Return user with original password for login
        return { ...user, originalPassword: userPassword };
    }

    async getAccessToken(user: any) {
        const authService = this.app.get(AuthService);
        const result = await authService.login({
            email: user.email,
            password: user.originalPassword || user.password
        });
        return result.accessToken;
    }

    async createUserWithTrip() {
        const user = await this.createUser();
        const accessToken = await this.getAccessToken(user);

        const trip = await this.prisma.trip.create({
            data: {
                title: 'Test Trip',
                provinceId: null,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-07'),
                description: 'Test trip description',
                userId: user.id
            }
        });

        // Create TripMember record for owner (this is needed for expense logic)
        await this.prisma.tripMember.create({
            data: {
                tripId: trip.id,
                userId: user.id
            }
        });

        return { user, trip, accessToken };
    }

    async addMemberToTrip(tripId: string, userId?: string) {
        const member = userId ? await this.prisma.user.findUnique({ where: { id: userId } }) : await this.createUser();
        
        await this.prisma.tripMember.create({
            data: {
                tripId,
                userId: member.id,
            }
        });

        return member;
    }

    async createExpense(tripId: number, payerId: number, participantIds: number[], expenseData?: any) {
        const defaultData = {
            title: 'Test Expense',
            amount: 100000,
            date: new Date('2024-01-15T12:00:00Z'),
            description: 'Test expense description',
            ...expenseData
        };

        const expense = await this.prisma.expense.create({
            data: {
                ...defaultData,
                tripId,
                payerId,
                participants: {
                    create: participantIds.map(participantId => ({
                        userId: participantId
                    }))
                }
            }
        });

        return expense;
    }

    async cleanup() {
        // Delete in correct order to respect foreign key constraints
        await this.prisma.expenseParticipant.deleteMany();
        await this.prisma.expense.deleteMany();
        await this.prisma.activity.deleteMany();
        await this.prisma.day.deleteMany();
        await this.prisma.tripMember.deleteMany();
        await this.prisma.trip.deleteMany();
        await this.prisma.user.deleteMany();
    }
}
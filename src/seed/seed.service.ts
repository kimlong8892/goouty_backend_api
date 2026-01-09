import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(private readonly prisma: PrismaService) { }

    async seedDemoData() {
        this.logger.log('🌱 Starting demo data seeding...');

        // Check if demo user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: 'longshare9201@gmail.com' },
        });

        if (existingUser) {
            throw new ConflictException('Demo data has already been seeded (User "longshare9201@gmail.com" exists).');
        }

        // Create demo user
        const hashedPassword = await bcrypt.hash('demo123', 10);

        const demoUser = await this.prisma.user.upsert({
            where: { email: 'longshare9201@gmail.com' },
            update: {},
            create: {
                email: 'longshare9201@gmail.com',
                password: hashedPassword,
                fullName: 'Demo User',
                phoneNumber: '0123456789',
                notificationsEnabled: true,
            },
        });

        this.logger.log(`✅ Demo user created: ${demoUser.email}`);

        // Create additional users for trips with natural names
        const additionalUsers: any[] = [];
        const userNames = [
            'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Cường', 'Phạm Thị Dung', 'Hoàng Văn Em',
            'Vũ Thị Phương', 'Đặng Minh Giang', 'Bùi Thị Hoa', 'Ngô Văn Ích', 'Dương Thị Kim'
        ];

        for (let i = 0; i < 10; i++) {
            const hashedPassword = await bcrypt.hash('demo123', 10);
            const user = await this.prisma.user.upsert({
                where: { email: `user${i + 1}@demo.com` },
                update: {},
                create: {
                    email: `user${i + 1}@demo.com`,
                    password: hashedPassword,
                    fullName: userNames[i],
                    phoneNumber: `012345678${i + 1}`,
                    notificationsEnabled: true,
                },
            });
            additionalUsers.push(user);
        }

        this.logger.log(`✅ Additional users created: ${additionalUsers.length}`);

        // Get some provinces for trips
        const provinces = await Promise.all([
            this.prisma.province.findFirst({ where: { codename: 'thanh_pho_ha_noi' } }),
            this.prisma.province.findFirst({ where: { codename: 'thanh_pho_ho_chi_minh' } }),
            this.prisma.province.findFirst({ where: { codename: 'thanh_pho_da_nang' } }),
            this.prisma.province.findFirst({ where: { codename: 'tinh_quang_nam' } }),
            this.prisma.province.findFirst({ where: { codename: 'tinh_thua_thien_hue' } }),
            this.prisma.province.findFirst({ where: { codename: 'tinh_khanh_hoa' } }),
            this.prisma.province.findFirst({ where: { codename: 'tinh_kien_giang' } }),
            this.prisma.province.findFirst({ where: { codename: 'tinh_lao_cai' } }),
        ]);

        const [hanoi, hcm, danang, hoiAn, hue, nhaTrang, phuQuoc, sapa] = provinces;

        // Create 20 trips with different destinations and durations
        const tripData = [
            {
                title: 'Khám phá Hà Nội 3 ngày 2 đêm',
                description: 'Chuyến du lịch khám phá thủ đô Hà Nội với những địa điểm nổi tiếng',
                provinceId: hanoi?.id,
                startDate: new Date('2024-12-15'),
                shareToken: 'hanoi-demo-2024',
                avatar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Du lịch Sài Gòn 2 ngày 1 đêm',
                description: 'Khám phá thành phố Hồ Chí Minh sôi động',
                provinceId: hcm?.id,
                startDate: new Date('2024-12-20'),
                shareToken: 'saigon-demo-2024',
                avatar: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Du lịch Đà Nẵng - Hội An 4 ngày 3 đêm',
                description: 'Khám phá miền Trung với Đà Nẵng và Hội An cổ kính',
                provinceId: danang?.id,
                startDate: new Date('2024-12-25'),
                shareToken: 'danang-hoian-demo-2024',
                avatar: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Nghỉ dưỡng Nha Trang 5 ngày 4 đêm',
                description: 'Tận hưởng biển đẹp và ẩm thực hải sản',
                provinceId: nhaTrang?.id,
                startDate: new Date('2025-01-05'),
                shareToken: 'nhatrang-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Khám phá Huế 3 ngày 2 đêm',
                description: 'Tìm hiểu cố đô Huế với kiến trúc cổ kính',
                provinceId: hue?.id,
                startDate: new Date('2025-01-12'),
                shareToken: 'hue-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Du lịch Phú Quốc 4 ngày 3 đêm',
                description: 'Thiên đường biển đảo với bãi biển tuyệt đẹp',
                provinceId: phuQuoc?.id,
                startDate: new Date('2025-01-20'),
                shareToken: 'phuquoc-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Sapa trekking 3 ngày 2 đêm',
                description: 'Khám phá vùng núi Tây Bắc và văn hóa dân tộc',
                provinceId: sapa?.id,
                startDate: new Date('2025-01-28'),
                shareToken: 'sapa-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Hà Nội - Hạ Long 4 ngày 3 đêm',
                description: 'Kết hợp thủ đô và vịnh Hạ Long kỳ quan',
                provinceId: hanoi?.id,
                startDate: new Date('2025-02-05'),
                shareToken: 'hanoi-halong-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'TP.HCM - Cần Thơ 3 ngày 2 đêm',
                description: 'Khám phá miền Tây sông nước',
                provinceId: hcm?.id,
                startDate: new Date('2025-02-12'),
                shareToken: 'saigon-cantho-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Đà Nẵng - Bà Nà Hills 2 ngày 1 đêm',
                description: 'Tham quan khu du lịch Bà Nà Hills',
                provinceId: danang?.id,
                startDate: new Date('2025-02-18'),
                shareToken: 'danang-bana-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Hội An - Cù Lao Chàm 3 ngày 2 đêm',
                description: 'Phố cổ Hội An và đảo Cù Lao Chàm',
                provinceId: hoiAn?.id,
                startDate: new Date('2025-02-25'),
                shareToken: 'hoian-culaocham-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Nha Trang - Đà Lạt 5 ngày 4 đêm',
                description: 'Biển và núi - hai trong một',
                provinceId: nhaTrang?.id,
                startDate: new Date('2025-03-05'),
                shareToken: 'nhatrang-dalat-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Huế - Lăng Cô 3 ngày 2 đêm',
                description: 'Cố đô Huế và bãi biển Lăng Cô',
                provinceId: hue?.id,
                startDate: new Date('2025-03-12'),
                shareToken: 'hue-langco-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Phú Quốc - Rừng U Minh 4 ngày 3 đêm',
                description: 'Đảo ngọc và rừng U Minh Thượng',
                provinceId: phuQuoc?.id,
                startDate: new Date('2025-03-20'),
                shareToken: 'phuquoc-uminh-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Sapa - Bắc Hà 4 ngày 3 đêm',
                description: 'Khám phá vùng cao Tây Bắc',
                provinceId: sapa?.id,
                startDate: new Date('2025-03-28'),
                shareToken: 'sapa-bacha-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Hà Nội - Mai Châu 2 ngày 1 đêm',
                description: 'Thung lũng Mai Châu xanh mát',
                provinceId: hanoi?.id,
                startDate: new Date('2025-04-05'),
                shareToken: 'hanoi-maichau-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'TP.HCM - Vũng Tàu 2 ngày 1 đêm',
                description: 'Biển Vũng Tàu gần Sài Gòn',
                provinceId: hcm?.id,
                startDate: new Date('2025-04-12'),
                shareToken: 'saigon-vungtau-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Đà Nẵng - Hội An - Huế 5 ngày 4 đêm',
                description: 'Tour miền Trung trọn gói',
                provinceId: danang?.id,
                startDate: new Date('2025-04-20'),
                shareToken: 'mientrung-tron-goi-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Nha Trang - Cam Ranh 3 ngày 2 đêm',
                description: 'Biển Nha Trang và sân bay Cam Ranh',
                provinceId: nhaTrang?.id,
                startDate: new Date('2025-04-28'),
                shareToken: 'nhatrang-camranh-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format&q=80',
            },
            {
                title: 'Phú Quốc - Hòn Thơm 4 ngày 3 đêm',
                description: 'Đảo Phú Quốc và Hòn Thơm Paradise',
                provinceId: phuQuoc?.id,
                startDate: new Date('2025-05-05'),
                shareToken: 'phuquoc-honthom-demo-2025',
                avatar: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80',
            },
        ];

        // Create all trips
        const trips: any[] = [];
        for (const tripInfo of tripData) {
            // Check if trip already exists by shareToken to avoid duplicates if partial seed happened? 
            // But we rely on user check mainly. 
            // For safety, let's just create.

            const trip = await this.prisma.trip.create({
                data: {
                    ...tripInfo,
                    userId: demoUser.id,
                    isPublic: true,
                },
            });
            trips.push(trip);
            this.logger.log(`✅ Trip created: ${trip.title}`);
        }

        // Add TripMembers for all trips (demo user + 10 additional users)
        const allTripMembers: any[] = [];
        for (const trip of trips) {
            const tripMembers = [demoUser, ...additionalUsers];
            allTripMembers.push(tripMembers);

            for (const user of tripMembers) {
                await this.prisma.tripMember.create({
                    data: {
                        userId: user.id,
                        tripId: trip.id,
                        status: 'accepted',
                        joinedAt: new Date(),
                    },
                });
            }
            this.logger.log(`✅ Added ${tripMembers.length} members to ${trip.title}`);
        }

        // Create expenses and settlements for all 20 trips
        this.logger.log('💰 Creating expenses and settlements for all trips...');

        for (let tripIndex = 0; tripIndex < trips.length; tripIndex++) {
            const trip = trips[tripIndex];
            const members = allTripMembers[tripIndex];

            // Generate 30-35 expenses per trip with even amounts
            const expenseTypes = [
                { title: 'Khách sạn', baseAmount: 2000000, description: 'Chi phí khách sạn cho cả nhóm' },
                { title: 'Ăn sáng', baseAmount: 200000, description: 'Bữa sáng tại khách sạn' },
                { title: 'Ăn trưa', baseAmount: 800000, description: 'Bữa trưa tại nhà hàng địa phương' },
                { title: 'Ăn tối', baseAmount: 1000000, description: 'Bữa tối tại nhà hàng' },
                { title: 'Vé tham quan', baseAmount: 1200000, description: 'Vé vào các địa điểm tham quan' },
                { title: 'Taxi/Grab', baseAmount: 600000, description: 'Chi phí di chuyển' },
                { title: 'Xăng xe', baseAmount: 500000, description: 'Chi phí xăng xe thuê' },
                { title: 'Mua sắm', baseAmount: 1500000, description: 'Mua quà lưu niệm' },
                { title: 'Bảo hiểm du lịch', baseAmount: 300000, description: 'Bảo hiểm du lịch' },
                { title: 'Hướng dẫn viên', baseAmount: 800000, description: 'Thuê hướng dẫn viên' },
                { title: 'Vé máy bay', baseAmount: 3000000, description: 'Vé máy bay khứ hồi' },
                { title: 'Vé tàu', baseAmount: 1200000, description: 'Vé tàu hỏa' },
                { title: 'Vé xe khách', baseAmount: 800000, description: 'Vé xe khách' },
                { title: 'Thuê xe máy', baseAmount: 400000, description: 'Thuê xe máy tham quan' },
                { title: 'Thuê xe đạp', baseAmount: 200000, description: 'Thuê xe đạp' },
                { title: 'Massage', baseAmount: 600000, description: 'Massage thư giãn' },
                { title: 'Spa', baseAmount: 1000000, description: 'Dịch vụ spa' },
                { title: 'Karaoke', baseAmount: 500000, description: 'Karaoke giải trí' },
                { title: 'Bar/Club', baseAmount: 800000, description: 'Chi phí bar/club' },
                { title: 'Cà phê', baseAmount: 300000, description: 'Cà phê thư giãn' },
                { title: 'Trà sữa', baseAmount: 150000, description: 'Trà sữa giải khát' },
                { title: 'Bánh kẹo', baseAmount: 200000, description: 'Bánh kẹo đặc sản' },
                { title: 'Hoa quả', baseAmount: 250000, description: 'Hoa quả tươi' },
                { title: 'Nước uống', baseAmount: 100000, description: 'Nước uống giải khát' },
                { title: 'Thuốc men', baseAmount: 200000, description: 'Thuốc men y tế' },
                { title: 'Giặt ủi', baseAmount: 150000, description: 'Dịch vụ giặt ủi' },
                { title: 'Internet', baseAmount: 100000, description: 'Chi phí internet' },
                { title: 'Điện thoại', baseAmount: 200000, description: 'Chi phí điện thoại' },
                { title: 'Tip', baseAmount: 100000, description: 'Tiền tip dịch vụ' },
                { title: 'Phí phát sinh', baseAmount: 300000, description: 'Các chi phí phát sinh khác' },
            ];

            const expenses: any[] = [];
            const numExpenses = 30 + Math.floor(Math.random() * 6); // 30-35 expenses

            for (let i = 0; i < numExpenses; i++) {
                const expenseType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
                const variation = 0.8 + Math.random() * 0.4; // ±20% variation
                const amount = Math.round(expenseType.baseAmount * variation / 1000) * 1000; // Round to nearest 1000

                expenses.push({
                    title: expenseType.title,
                    amount: amount,
                    date: new Date(trip.startDate!.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within 7 days from start
                    description: expenseType.description,
                    payerId: members[Math.floor(Math.random() * members.length)].id,
                    participantIds: members.map((m: any) => m.id),
                });
            }

            // Create expenses in database
            for (const expenseData of expenses) {
                const expense = await this.prisma.expense.create({
                    data: {
                        title: expenseData.title,
                        amount: expenseData.amount,
                        date: expenseData.date,
                        description: expenseData.description,
                        payerId: expenseData.payerId,
                        tripId: trip.id,
                    },
                });

                // Create ExpenseParticipant records for each participant
                const amountPerPerson = Math.round(expenseData.amount / expenseData.participantIds.length / 1000) * 1000; // Round to nearest 1000
                for (const participantId of expenseData.participantIds) {
                    await this.prisma.expenseParticipant.create({
                        data: {
                            expenseId: expense.id,
                            userId: participantId,
                            amount: amountPerPerson,
                        },
                    });
                }
            }

            this.logger.log(`✅ Created ${expenses.length} expenses for ${trip.title}`);
        }

        // Create PaymentSettlements for all trips
        this.logger.log('💳 Creating payment settlements for all trips...');

        for (let tripIndex = 0; tripIndex < trips.length; tripIndex++) {
            const trip = trips[tripIndex];
            const members = allTripMembers[tripIndex];

            // Get all expenses for this trip
            const tripExpenses = await this.prisma.expense.findMany({
                where: { tripId: trip.id },
                include: {
                    participants: true,
                    payer: true,
                },
            });

            // Calculate net amounts for each user
            const userBalances = new Map<string, number>();

            // Initialize balances
            members.forEach((member: any) => {
                userBalances.set(member.id, 0);
            });

            // Calculate what each user paid vs what they owe
            tripExpenses.forEach(expense => {
                const payerId = expense.payerId;
                const totalAmount = Number(expense.amount);

                // Add to payer's balance (they paid)
                userBalances.set(payerId, userBalances.get(payerId)! + totalAmount);

                // Subtract from each participant's balance (they owe)
                expense.participants.forEach(participant => {
                    const amountOwed = Number(participant.amount);
                    userBalances.set(participant.userId, userBalances.get(participant.userId)! - amountOwed);
                });
            });

            // Create settlements between users
            const settlements: any[] = [];
            const balances = Array.from(userBalances.entries()).map(([userId, balance]) => ({
                userId,
                balance,
                user: members.find((m: any) => m.id === userId)!
            }));

            // Sort by balance (creditors first, then debtors)
            balances.sort((a, b) => b.balance - a.balance);

            let i = 0; // creditor index
            let j = balances.length - 1; // debtor index

            while (i < j) {
                const creditor = balances[i];
                const debtor = balances[j];

                if (Math.abs(creditor.balance) < 0.01 && Math.abs(debtor.balance) < 0.01) {
                    break; // Both are settled
                }

                if (creditor.balance <= 0) {
                    i++;
                    continue;
                }

                if (debtor.balance >= 0) {
                    j--;
                    continue;
                }

                // Calculate settlement amount
                const settlementAmount = Math.min(creditor.balance, Math.abs(debtor.balance));

                if (settlementAmount > 0.01) { // Only create if amount is significant
                    const settlement = await this.prisma.paymentSettlement.create({
                        data: {
                            amount: Math.round(settlementAmount / 1000) * 1000, // Round to nearest 1000
                            status: 'pending',
                            description: `${debtor.user.fullName} nợ ${creditor.user.fullName} ${Math.round(settlementAmount / 1000) * 1000} VND`,
                            tripId: trip.id,
                            creditorId: creditor.userId,
                            debtorId: debtor.userId,
                        },
                    });

                    settlements.push(settlement);

                    // Update balances
                    creditor.balance -= settlementAmount;
                    debtor.balance += settlementAmount;
                }

                // Move to next pair if current one is settled
                if (Math.abs(creditor.balance) < 0.01) i++;
                if (Math.abs(debtor.balance) < 0.01) j--;
            }

            this.logger.log(`✅ Created ${settlements.length} payment settlements for ${trip.title}`);
        }

        // Create days and activities for all trips
        this.logger.log('📅 Creating days and activities for all trips...');

        for (let tripIndex = 0; tripIndex < trips.length; tripIndex++) {
            const trip = trips[tripIndex];
            const tripStartDate = new Date(trip.startDate!);
            // Default to 3 days if no end date (since we removed endDate)
            const daysDiff = 3;

            this.logger.log(`📅 Creating ${daysDiff} days for ${trip.title}`);

            // Create days for the trip
            const days: any[] = [];
            for (let dayIndex = 0; dayIndex < daysDiff; dayIndex++) {
                const dayDate = new Date(tripStartDate);
                dayDate.setDate(dayDate.getDate() + dayIndex);

                const day = await this.prisma.day.create({
                    data: {
                        title: `Ngày ${dayIndex + 1}`,
                        description: `Ngày ${dayIndex + 1} của chuyến du lịch`,
                        date: dayDate,
                        startTime: new Date(dayDate.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
                        tripId: trip.id,
                    },
                });
                days.push(day);
            }

            // Create activities for each day
            const activityTemplates = [
                { title: 'Ăn sáng', duration: 60, location: 'Khách sạn', notes: 'Bữa sáng tại khách sạn' },
                { title: 'Tham quan địa điểm nổi tiếng', duration: 120, location: 'Địa điểm tham quan', notes: 'Khám phá địa điểm du lịch', important: true },
                { title: 'Ăn trưa', duration: 90, location: 'Nhà hàng địa phương', notes: 'Thử ẩm thực địa phương' },
                { title: 'Mua sắm', duration: 120, location: 'Chợ/Trung tâm thương mại', notes: 'Mua quà lưu niệm' },
                { title: 'Tham quan bảo tàng', duration: 90, location: 'Bảo tàng', notes: 'Tìm hiểu văn hóa lịch sử' },
                { title: 'Đi dạo phố cổ', duration: 60, location: 'Phố cổ', notes: 'Tận hưởng không khí cổ kính' },
                { title: 'Ăn tối', duration: 90, location: 'Nhà hàng', notes: 'Bữa tối thư giãn' },
                { title: 'Xem biểu diễn', duration: 120, location: 'Nhà hát/Sân khấu', notes: 'Thưởng thức nghệ thuật', important: true },
                { title: 'Tắm biển', duration: 180, location: 'Bãi biển', notes: 'Thư giãn và tắm biển' },
                { title: 'Leo núi', duration: 240, location: 'Núi', notes: 'Khám phá thiên nhiên', important: true },
                { title: 'Tham quan chùa', duration: 60, location: 'Chùa', notes: 'Tìm hiểu tôn giáo' },
                { title: 'Uống cà phê', duration: 45, location: 'Quán cà phê', notes: 'Thư giãn và trò chuyện' },
                { title: 'Chụp ảnh', duration: 30, location: 'Địa điểm đẹp', notes: 'Lưu lại kỷ niệm' },
                { title: 'Massage', duration: 90, location: 'Spa', notes: 'Thư giãn và chăm sóc sức khỏe' },
                { title: 'Karaoke', duration: 120, location: 'Karaoke', notes: 'Giải trí và ca hát' },
            ];

            for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
                const day = days[dayIndex];
                const dayDate = new Date(day.date);

                // Create 3-5 activities per day
                const numActivities = 3 + Math.floor(Math.random() * 3); // 3-5 activities
                let currentTime = new Date(dayDate.getTime() + 8 * 60 * 60 * 1000); // Start at 8:00 AM

                for (let activityIndex = 0; activityIndex < numActivities; activityIndex++) {
                    const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
                    const activity = await this.prisma.activity.create({
                        data: {
                            title: template.title,
                            startTime: new Date(currentTime),
                            durationMin: template.duration,
                            location: template.location,
                            notes: template.notes,
                            important: template.important || false,
                            dayId: day.id,
                        },
                    });

                    // Move to next activity time
                    currentTime = new Date(currentTime.getTime() + template.duration * 60 * 1000 + 30 * 60 * 1000); // Add 30 min break
                }
            }

            this.logger.log(`✅ Created ${days.length} days with activities for ${trip.title}`);
        }

        const stats = {
            users: 11,
            trips: 20,
            tripMembers: 220,
            expenses: await this.prisma.expense.count(),
            paymentSettlements: await this.prisma.paymentSettlement.count(),
            days: await this.prisma.day.count(),
            activities: await this.prisma.activity.count(),
        };

        this.logger.log('🎉 Demo data seeding completed!');
        return stats;
    }

    async seedTripTemplates() {
        this.logger.log('Starting to seed trip templates...');

        // Get all provinces
        const provinces = await this.prisma.province.findMany();
        this.logger.log(`Found ${provinces.length} provinces`);

        // Create a demo user for templates
        let demoUser = await this.prisma.user.findFirst({
            where: { email: 'demo@templates.com' }
        });

        if (!demoUser) {
            const hashedPassword = await bcrypt.hash('hashedpassword', 10);
            demoUser = await this.prisma.user.create({
                data: {
                    email: 'demo@templates.com',
                    fullName: 'Demo User',
                    password: hashedPassword
                }
            });
            this.logger.log('Created demo user for templates');
        } else {
            // Check if templates already exist for this user?
            // Since we want "seed 1 time", if user exists we can assume it might be seeded.
            // But let's check if there are any templates created by this user to be sure.
            const templatesCount = await this.prisma.tripTemplate.count();

            if (templatesCount > 0) {
                throw new ConflictException('Trip templates have already been seeded.');
            }
        }

        // Create templates for each province
        let totalTemplates = 0;
        for (const province of provinces) {
            // Create 10 templates per province
            for (let i = 1; i <= 10; i++) {
                const templateTitle = this.generateTemplateTitle(province.name, i);
                const templateDescription = this.generateTemplateDescription(province.name, i);
                const templateAvatar = this.generateTemplateAvatar(i);

                await this.prisma.tripTemplate.create({
                    data: {
                        title: templateTitle,
                        description: templateDescription,
                        avatar: templateAvatar,
                        province: province.id ? { connect: { id: province.id } } : undefined,
                        isPublic: true,
                        days: {
                            create: this.generateDaysForTemplate(i, province.name)
                        }
                    }
                });
                totalTemplates++;
            }
        }

        this.logger.log(`Seeded ${totalTemplates} trip templates successfully!`);
        return { count: totalTemplates, message: 'Trip templates seeded successfully' };
    }

    private generateTemplateTitle(provinceName: string, templateNumber: number) {
        const templates = [
            `Khám phá ${provinceName} ${templateNumber} ngày`,
            `${provinceName} cuối tuần`,
            `Du lịch ${provinceName} gia đình`,
            `${provinceName} ẩm thực`,
            `${provinceName} văn hóa`,
            `${provinceName} thiên nhiên`,
            `${provinceName} nghỉ dưỡng`,
            `${provinceName} phiêu lưu`,
            `${provinceName} mua sắm`,
            `${provinceName} nhiếp ảnh`
        ];
        return templates[(templateNumber - 1) % templates.length];
    }

    private generateTemplateDescription(provinceName: string, templateNumber: number) {
        const descriptions = [
            `Hành trình khám phá ${provinceName} với các điểm đến nổi tiếng`,
            `Hành trình ngắn gọn cho cuối tuần tại ${provinceName}`,
            `Hành trình phù hợp cho gia đình tại ${provinceName}`,
            `Khám phá ẩm thực đặc sắc của ${provinceName}`,
            `Tìm hiểu văn hóa và lịch sử ${provinceName}`,
            `Khám phá thiên nhiên hoang dã tại ${provinceName}`,
            `Hành trình nghỉ dưỡng thư giãn tại ${provinceName}`,
            `Hành trình phiêu lưu mạo hiểm tại ${provinceName}`,
            `Hành trình mua sắm và thương mại tại ${provinceName}`,
            `Hành trình chụp ảnh và khám phá cảnh đẹp ${provinceName}`
        ];
        return descriptions[(templateNumber - 1) % descriptions.length];
    }

    private generateTemplateAvatar(templateNumber: number) {
        const avatarUrls = [
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop&crop=center', // Nature
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center', // Weekend
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&crop=center', // Family
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&crop=center', // Food
            'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=300&fit=crop&crop=center', // Culture
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center', // Nature
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center', // Relaxation
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center', // Shopping
            'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&crop=center'  // Photography
        ];
        return avatarUrls[(templateNumber - 1) % avatarUrls.length];
    }

    private generateDaysForTemplate(dayCount: number, provinceName: string) {
        const days: any[] = [];
        for (let i = 1; i <= dayCount; i++) {
            days.push({
                title: `Ngày ${i}: Khám phá ${provinceName}`,
                description: `Hành trình ngày ${i} tại ${provinceName}`,
                dayOrder: i,
                activities: {
                    create: this.generateActivitiesForDay(i, provinceName)
                }
            });
        }
        return days;
    }

    private generateActivitiesForDay(dayNumber: number, provinceName: string) {
        const activities = [
            {
                title: `Tham quan điểm nổi tiếng ${provinceName}`,
                startTime: "08:00",
                durationMin: 120,
                location: `${provinceName}`,
                notes: null,
                important: true,
                activityOrder: 1
            },
            {
                title: `Ăn trưa đặc sản`,
                startTime: "12:00",
                durationMin: 90,
                location: `Nhà hàng ${provinceName}`,
                notes: null,
                important: true,
                activityOrder: 2
            },
            {
                title: `Dạo quanh trung tâm`,
                startTime: "14:00",
                durationMin: 180,
                location: `Trung tâm ${provinceName}`,
                notes: null,
                important: false,
                activityOrder: 3
            },
            {
                title: `Thưởng thức ẩm thực tối`,
                startTime: "19:00",
                durationMin: 120,
                location: `Nhà hàng tối`,
                notes: null,
                important: true,
                activityOrder: 4
            }
        ];

        // Return only the first 3 activities for shorter templates
        if (dayNumber <= 2) {
            return activities.slice(0, 3);
        }

        return activities;
    }

    async seedProvinces() {
        this.logger.log('Starting to seed Vietnamese provinces...');

        const vietnameseProvinces = [
            { name: "Thành phố Hà Nội", code: 1, divisionType: "tỉnh", codename: "thanh_pho_ha_noi", phoneCode: 24 },
            { name: "Tỉnh Hà Giang", code: 2, divisionType: "tỉnh", codename: "tinh_ha_giang", phoneCode: 219 },
            { name: "Tỉnh Cao Bằng", code: 4, divisionType: "tỉnh", codename: "tinh_cao_bang", phoneCode: 206 },
            { name: "Tỉnh Bắc Kạn", code: 6, divisionType: "tỉnh", codename: "tinh_bac_kan", phoneCode: 209 },
            { name: "Tỉnh Tuyên Quang", code: 8, divisionType: "tỉnh", codename: "tinh_tuyen_quang", phoneCode: 207 },
            { name: "Tỉnh Lào Cai", code: 10, divisionType: "tỉnh", codename: "tinh_lao_cai", phoneCode: 214 },
            { name: "Tỉnh Điện Biên", code: 11, divisionType: "tỉnh", codename: "tinh_dien_bien", phoneCode: 215 },
            { name: "Tỉnh Lai Châu", code: 12, divisionType: "tỉnh", codename: "tinh_lai_chau", phoneCode: 213 },
            { name: "Tỉnh Sơn La", code: 14, divisionType: "tỉnh", codename: "tinh_son_la", phoneCode: 212 },
            { name: "Tỉnh Yên Bái", code: 15, divisionType: "tỉnh", codename: "tinh_yen_bai", phoneCode: 216 },
            { name: "Tỉnh Hoà Bình", code: 17, divisionType: "tỉnh", codename: "tinh_hoa_binh", phoneCode: 218 },
            { name: "Tỉnh Thái Nguyên", code: 19, divisionType: "tỉnh", codename: "tinh_thai_nguyen", phoneCode: 208 },
            { name: "Tỉnh Lạng Sơn", code: 20, divisionType: "tỉnh", codename: "tinh_lang_son", phoneCode: 205 },
            { name: "Tỉnh Quảng Ninh", code: 22, divisionType: "tỉnh", codename: "tinh_quang_ninh", phoneCode: 203 },
            { name: "Tỉnh Bắc Giang", code: 24, divisionType: "tỉnh", codename: "tinh_bac_giang", phoneCode: 204 },
            { name: "Tỉnh Phú Thọ", code: 25, divisionType: "tỉnh", codename: "tinh_phu_tho", phoneCode: 210 },
            { name: "Tỉnh Vĩnh Phúc", code: 26, divisionType: "tỉnh", codename: "tinh_vinh_phuc", phoneCode: 211 },
            { name: "Tỉnh Bắc Ninh", code: 27, divisionType: "tỉnh", codename: "tinh_bac_ninh", phoneCode: 222 },
            { name: "Tỉnh Hải Dương", code: 30, divisionType: "tỉnh", codename: "tinh_hai_duong", phoneCode: 220 },
            { name: "Thành phố Hải Phòng", code: 31, divisionType: "tỉnh", codename: "thanh_pho_hai_phong", phoneCode: 225 },
            { name: "Tỉnh Hưng Yên", code: 33, divisionType: "tỉnh", codename: "tinh_hung_yen", phoneCode: 221 },
            { name: "Tỉnh Thái Bình", code: 34, divisionType: "tỉnh", codename: "tinh_thai_binh", phoneCode: 227 },
            { name: "Tỉnh Hà Nam", code: 35, divisionType: "tỉnh", codename: "tinh_ha_nam", phoneCode: 226 },
            { name: "Tỉnh Nam Định", code: 36, divisionType: "tỉnh", codename: "tinh_nam_dinh", phoneCode: 228 },
            { name: "Tỉnh Ninh Bình", code: 37, divisionType: "tỉnh", codename: "tinh_ninh_binh", phoneCode: 229 },
            { name: "Tỉnh Thanh Hóa", code: 38, divisionType: "tỉnh", codename: "tinh_thanh_hoa", phoneCode: 237 },
            { name: "Tỉnh Nghệ An", code: 40, divisionType: "tỉnh", codename: "tinh_nghe_an", phoneCode: 238 },
            { name: "Tỉnh Hà Tĩnh", code: 42, divisionType: "tỉnh", codename: "tinh_ha_tinh", phoneCode: 239 },
            { name: "Tỉnh Quảng Bình", code: 44, divisionType: "tỉnh", codename: "tinh_quang_binh", phoneCode: 232 },
            { name: "Tỉnh Quảng Trị", code: 45, divisionType: "tỉnh", codename: "tinh_quang_tri", phoneCode: 233 },
            { name: "Thành phố Huế", code: 46, divisionType: "tỉnh", codename: "thanh_pho_hue", phoneCode: 234 },
            { name: "Thành phố Đà Nẵng", code: 48, divisionType: "tỉnh", codename: "thanh_pho_da_nang", phoneCode: 236 },
            { name: "Tỉnh Quảng Nam", code: 49, divisionType: "tỉnh", codename: "tinh_quang_nam", phoneCode: 235 },
            { name: "Tỉnh Quảng Ngãi", code: 51, divisionType: "tỉnh", codename: "tinh_quang_ngai", phoneCode: 255 },
            { name: "Tỉnh Bình Định", code: 52, divisionType: "tỉnh", codename: "tinh_binh_dinh", phoneCode: 256 },
            { name: "Tỉnh Phú Yên", code: 54, divisionType: "tỉnh", codename: "tinh_phu_yen", phoneCode: 257 },
            { name: "Tỉnh Khánh Hòa", code: 56, divisionType: "tỉnh", codename: "tinh_khanh_hoa", phoneCode: 258 },
            { name: "Tỉnh Ninh Thuận", code: 58, divisionType: "tỉnh", codename: "tinh_ninh_thuan", phoneCode: 259 },
            { name: "Tỉnh Bình Thuận", code: 60, divisionType: "tỉnh", codename: "tinh_binh_thuan", phoneCode: 252 },
            { name: "Tỉnh Kon Tum", code: 62, divisionType: "tỉnh", codename: "tinh_kon_tum", phoneCode: 260 },
            { name: "Tỉnh Gia Lai", code: 64, divisionType: "tỉnh", codename: "tinh_gia_lai", phoneCode: 269 },
            { name: "Tỉnh Đắk Lắk", code: 66, divisionType: "tỉnh", codename: "tinh_dak_lak", phoneCode: 262 },
            { name: "Tỉnh Đắk Nông", code: 67, divisionType: "tỉnh", codename: "tinh_dak_nong", phoneCode: 261 },
            { name: "Tỉnh Lâm Đồng", code: 68, divisionType: "tỉnh", codename: "tinh_lam_dong", phoneCode: 263 },
            { name: "Tỉnh Bình Phước", code: 70, divisionType: "tỉnh", codename: "tinh_binh_phuoc", phoneCode: 271 },
            { name: "Tỉnh Tây Ninh", code: 72, divisionType: "tỉnh", codename: "tinh_tay_ninh", phoneCode: 276 },
            { name: "Tỉnh Bình Dương", code: 74, divisionType: "tỉnh", codename: "tinh_binh_duong", phoneCode: 274 },
            { name: "Tỉnh Đồng Nai", code: 75, divisionType: "tỉnh", codename: "tinh_dong_nai", phoneCode: 251 },
            { name: "Tỉnh Bà Rịa - Vũng Tàu", code: 77, divisionType: "tỉnh", codename: "tinh_ba_ria_vung_tau", phoneCode: 254 },
            { name: "Thành phố Hồ Chí Minh", code: 79, divisionType: "tỉnh", codename: "thanh_pho_ho_chi_minh", phoneCode: 28 },
            { name: "Tỉnh Long An", code: 80, divisionType: "tỉnh", codename: "tinh_long_an", phoneCode: 272 },
            { name: "Tỉnh Tiền Giang", code: 82, divisionType: "tỉnh", codename: "tinh_tien_giang", phoneCode: 273 },
            { name: "Tỉnh Bến Tre", code: 83, divisionType: "tỉnh", codename: "tinh_ben_tre", phoneCode: 275 },
            { name: "Tỉnh Trà Vinh", code: 84, divisionType: "tỉnh", codename: "tinh_tra_vinh", phoneCode: 294 },
            { name: "Tỉnh Vĩnh Long", code: 86, divisionType: "tỉnh", codename: "tinh_vinh_long", phoneCode: 270 },
            { name: "Tỉnh Đồng Tháp", code: 87, divisionType: "tỉnh", codename: "tinh_dong_thap", phoneCode: 277 },
            { name: "Tỉnh An Giang", code: 89, divisionType: "tỉnh", codename: "tinh_an_giang", phoneCode: 296 },
            { name: "Tỉnh Kiên Giang", code: 91, divisionType: "tỉnh", codename: "tinh_kien_giang", phoneCode: 297 },
            { name: "Thành phố Cần Thơ", code: 92, divisionType: "tỉnh", codename: "thanh_pho_can_tho", phoneCode: 292 },
            { name: "Tỉnh Hậu Giang", code: 93, divisionType: "tỉnh", codename: "tinh_hau_giang", phoneCode: 293 },
            { name: "Tỉnh Sóc Trăng", code: 94, divisionType: "tỉnh", codename: "tinh_soc_trang", phoneCode: 299 },
            { name: "Tỉnh Bạc Liêu", code: 95, divisionType: "tỉnh", codename: "tinh_bac_lieu", phoneCode: 291 },
            { name: "Tỉnh Cà Mau", code: 96, divisionType: "tỉnh", codename: "tinh_ca_mau", phoneCode: 290 },
        ];

        // Insert provinces
        let count = 0;
        for (const provinceData of vietnameseProvinces) {
            await this.prisma.province.upsert({
                where: { code: provinceData.code },
                update: {},
                create: provinceData,
            });
            count++;
        }

        this.logger.log(`Seeded ${count} provinces successfully!`);
        return { count, message: 'Provinces seeded successfully' };
    }

    async resetDatabase() {
        this.logger.log('⚠ Resetting database...');

        await this.prisma.paymentTransaction.deleteMany();
        await this.prisma.paymentSettlement.deleteMany();
        await this.prisma.expenseParticipant.deleteMany();
        await this.prisma.expense.deleteMany();
        await this.prisma.activity.deleteMany(); // Activity depends on Day
        await this.prisma.day.deleteMany(); // Day depends on Trip
        await this.prisma.tripMember.deleteMany();
        await this.prisma.tripTemplateActivity.deleteMany();
        await this.prisma.tripTemplateDay.deleteMany();
        await this.prisma.tripTemplate.deleteMany();
        await this.prisma.trip.deleteMany();
        await this.prisma.province.deleteMany();
        await this.prisma.notification.deleteMany();
        await this.prisma.device.deleteMany();
        await this.prisma.socialAccount.deleteMany();
        await this.prisma.user.deleteMany();

        this.logger.log('✅ Database reset complete.');
        return { message: 'Database reset successfully' };
    }

    async seedAll() {
        this.logger.log('🚀 Starting full seed process...');

        await this.resetDatabase();
        await this.seedProvinces();
        const demoStats = await this.seedDemoData();
        const templateStats = await this.seedTripTemplates();

        this.logger.log('🎉 Full seed completed successfully!');

        return {
            message: 'Full seed completed successfully',
            demoStats,
            templateStats
        };
    }
}

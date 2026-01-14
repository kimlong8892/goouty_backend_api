import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed trip templates...');

  // Get all provinces
  const provinces = await prisma.province.findMany();
  console.log(`Found ${provinces.length} provinces`);

  // Create a demo user for templates
  let demoUser = await prisma.user.findFirst({
    where: { email: 'demo@templates.com' }
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: 'demo@templates.com',
        fullName: 'Demo User',
        password: 'hashedpassword'
      }
    });
    console.log('Created demo user for templates');
  }

  // Clear existing trip templates
  await prisma.tripTemplate.deleteMany();

  // Create templates for each province
  for (const province of provinces) {
    // Create 10 templates per province
    for (let i = 1; i <= 10; i++) {
      const templateTitle = generateTemplateTitle(province.name, i);
      const templateDescription = generateTemplateDescription(province.name, i);
      const templateAvatar = generateTemplateAvatar(i);

      await prisma.tripTemplate.create({
        data: {
          title: templateTitle,
          description: templateDescription,
          avatar: templateAvatar,
          fee: i * 500000,
          provinceId: province.id,
          isPublic: true,

          days: {
            create: generateDaysForTemplate(i, province.name)
          }
        }
      });
    }
  }

  console.log(`Seeded ${provinces.length * 10} trip templates successfully!`);
}

function generateTemplateTitle(provinceName: string, templateNumber: number) {
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
  return templates[templateNumber - 1];
}

function generateTemplateDescription(provinceName: string, templateNumber: number) {
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
  return descriptions[templateNumber - 1];
}

function generateTemplateAvatar(templateNumber: number) {
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
  return avatarUrls[templateNumber - 1];
}

function generateDaysForTemplate(dayCount: number, provinceName: string) {
  const days = [];
  for (let i = 1; i <= dayCount; i++) {
    days.push({
      title: `Ngày ${i}: Khám phá ${provinceName}`,
      description: `Hành trình ngày ${i} tại ${provinceName}`,
      dayOrder: i,
      activities: {
        create: generateActivitiesForDay(i, provinceName)
      }
    });
  }
  return days;
}

function generateActivitiesForDay(dayNumber: number, provinceName: string) {
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
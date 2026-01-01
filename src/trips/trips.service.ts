import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { TripsRepository } from './trips.repository';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JoinTripDto } from './dto/join-trip.dto';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { EnhancedNotificationService } from '../notifications/enhanced-notification.service';
import { UploadService } from '../upload/upload.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TripsService {
  constructor(
    private readonly tripsRepository: TripsRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationService: EnhancedNotificationService,
    private readonly uploadService: UploadService,
    private readonly i18n: I18nService,
  ) { }

  async create(createTripDto: CreateTripDto, userId: string) {
    // Validate dates if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (createTripDto.startDate) {
      startDate = new Date(createTripDto.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
    }

    if (createTripDto.endDate) {
      endDate = new Date(createTripDto.endDate);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }
    }

    // Check if end date is before start date (only if both are provided)
    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Create trip and add creator as admin member in a transaction
    const trip = await this.prisma.$transaction(async (prisma) => {
      // Create the trip
      const tripData: any = {
        title: createTripDto.title,
        description: createTripDto.description,
        startDate: startDate,
        endDate: endDate,
        user: { connect: { id: userId } }
      };

      // Only add province relation if provinceId is provided
      if (createTripDto.provinceId) {
        tripData.province = { connect: { id: createTripDto.provinceId } };
      }

      const trip = await prisma.trip.create({
        data: tripData
      });

      // Add the creator as an admin member
      await prisma.tripMember.create({
        data: {
          tripId: trip.id,
          userId: userId
        }
      });

      return trip;
    });

    // Send notification to all users about trip creation
    try {
      console.log('🚀 Sending trip creation notification for trip:', trip.id);
      await this.notificationService.sendTripCreatedNotification(
        trip.id,
        trip.title,
        userId
      );
      console.log('✅ Trip creation notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send trip creation notification:', error);
      // Don't throw error here to avoid breaking trip creation
    }

    return trip;
  }

  async findAll(userId: string, options?: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search ? {
      title: { contains: search, mode: 'insensitive' as const }
    } : {};

    // Lấy tất cả chuyến đi mà người dùng là chủ sở hữu (không áp dụng pagination ở đây)
    const ownedTrips = await this.tripsRepository.findAll({
      where: {
        userId,
        ...searchConditions
      },
      orderBy: { createdAt: 'desc' }
    });

    // Lấy tất cả chuyến đi mà người dùng là thành viên (chỉ những trip đã accepted)
    const memberTrips = await this.prisma.trip.findMany({
      where: {
        members: {
          some: {
            userId: userId,
            status: 'accepted' // Chỉ lấy những trip đã accepted
          }
        },
        userId: { not: userId }, // Exclude owned trips
        ...searchConditions
      },
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
          include: {
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
      },
      orderBy: { createdAt: 'desc' }
    });

    // Kết hợp cả hai danh sách
    const allTrips = [
      ...ownedTrips,
      ...memberTrips
    ];

    // Sort by createdAt descending (newest first)
    allTrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination to the combined results
    const paginatedTrips = allTrips.slice(skip, skip + limit);

    // Get total count for pagination
    const total = allTrips.length;

    return {
      trips: paginatedTrips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const trip = await this.tripsRepository.findOne(id);
    if (!trip) {
      throw new NotFoundException(
        this.i18n.t('trips.trip.notFound', { lang: 'vi' })
      );
    }
    return trip;
  }

  async findOneForUser(id: string, requestUserId: string) {
    const trip = await this.tripsRepository.findOne(id);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    // Cho phép nếu là chủ sở hữu
    if (trip.userId === requestUserId) {
      return trip;
    }

    // Cho phép nếu là thành viên đã được chấp nhận
    const membership = await this.prisma.tripMember.findUnique({
      where: {
        userId_tripId: { userId: requestUserId, tripId: id },
      },
      select: { status: true },
    });

    if (!membership || membership.status !== 'accepted') {
      throw new ForbiddenException('Bạn không có quyền xem chuyến đi này');
    }

    return trip;
  }

  async update(id: string, updateTripDto: UpdateTripDto, requestUserId: string) {
    // Check if trip exists
    const existingTrip = await this.findOne(id);

    // Check if the requesting user is the trip owner
    if (existingTrip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can update the trip');
    }

    const data: any = { ...updateTripDto };

    // Validate dates if provided
    let startDate = existingTrip.startDate;
    let endDate = existingTrip.endDate;

    if (updateTripDto.startDate) {
      startDate = new Date(updateTripDto.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
      data.startDate = startDate;
    } else if (updateTripDto.startDate === null) { // Explicitly handle null to clear date
      data.startDate = null;
      startDate = null;
    }

    if (updateTripDto.endDate) {
      endDate = new Date(updateTripDto.endDate);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }
      data.endDate = endDate;
    } else if (updateTripDto.endDate === null) { // Explicitly handle null to clear date
      data.endDate = null;
      endDate = null;
    }

    // Check if end date is before start date (only if both dates exist)
    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const updatedTrip = await this.tripsRepository.update(id, data);

    // Send notification about trip update
    try {
      await this.notificationService.sendTripUpdatedNotification(
        id,
        updatedTrip.title,
        requestUserId
      );
    } catch (error) {
      console.error('Failed to send trip update notification:', error);
      // Don't throw error here to avoid breaking trip update
    }

    return updatedTrip;
  }

  async remove(id: string, requestUserId: string) {
    // Check if trip exists and get trip details
    const trip = await this.findOne(id);

    // Check if the requesting user is the trip owner
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException(
        this.i18n.t('common.forbidden', { lang: 'vi' })
      );
    }

    // Send notification about trip deletion before deleting
    try {
      await this.notificationService.sendTripDeletedNotification(
        id,
        trip.title,
        requestUserId
      );
    } catch (error) {
      console.error('Failed to send trip deletion notification:', error);
      // Don't throw error here to avoid breaking trip deletion
    }

    return this.tripsRepository.remove(id);
  }

  // ===== TRIP MEMBERS MANAGEMENT =====

  async getTripMembers(tripId: string) {
    const trip = await this.findOne(tripId);

    return this.prisma.tripMember.findMany({
      where: {
        tripId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async addMemberToTrip(tripId: string, addMemberDto: AddMemberDto, requestUserId: string) {
    const trip = await this.findOne(tripId);

    // Chỉ chủ sở hữu mới được thêm thành viên
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can add members');
    }

    // Find user by email
    const userToAdd = await this.prisma.user.findUnique({
      where: { email: addMemberDto.email },
    });

    if (!userToAdd) {
      throw new NotFoundException(`Người dùng với email ${addMemberDto.email} không tồn tại`);
    }

    // Check if user is already a member
    const existingMember = await this.prisma.tripMember.findUnique({
      where: {
        userId_tripId: {
          userId: userToAdd.id,
          tripId: tripId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this trip');
    }

    // Tạo lời mời: trạng thái pending + token
    const inviteToken = randomBytes(32).toString('hex');
    const newMember = await this.prisma.tripMember.create({
      data: {
        userId: userToAdd.id,
        tripId: tripId,
        status: 'pending',
        inviteToken,
        invitedAt: new Date(),
        invitedById: requestUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
    });

    // Gửi email mời tham gia chuyến đi (best-effort)
    void this.emailService.sendTripInviteEmail({
      toEmail: newMember.user.email,
      inviteeName: newMember.user.fullName,
      tripTitle: trip.title,
      inviterName: undefined,
      acceptUrl: `${process.env.APP_URL}/invite?token=${inviteToken}`,
    });

    return newMember;
  }

  async removeMemberFromTrip(tripId: string, memberId: string, requestUserId: string) {
    const trip = await this.findOne(tripId);

    // Check if user is trip owner
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can remove members');
    }

    const member = await this.prisma.tripMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.tripId !== tripId) {
      throw new NotFoundException('Member not found in this trip');
    }

    // Cannot remove trip owner
    if (member.userId === trip.userId) {
      throw new ForbiddenException('Cannot remove trip owner');
    }

    return this.prisma.tripMember.delete({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // ===== SHARE LINK FUNCTIONALITY =====

  async generateShareLink(tripId: string, requestUserId: string) {
    const trip = await this.findOne(tripId);

    // Check if user is trip owner
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can generate share links');
    }

    // Generate unique share token
    const shareToken = randomBytes(32).toString('hex');

    // Update trip with share token and make it public
    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        shareToken,
        isPublic: true,
      },
    });

    return {
      shareToken,
      shareLink: `${process.env.APP_URL}/trip/${tripId}/${shareToken}`,
      tripId,
    };
  }

  async joinTripByToken(joinTripDto: JoinTripDto, userId: string) {
    const { shareToken } = joinTripDto;

    // Find trip by share token
    const trip = await this.prisma.trip.findUnique({
      where: { shareToken },
    });

    if (!trip || !trip.isPublic) {
      throw new NotFoundException('Invalid or expired share link');
    }

    // Check if user is already a member or owner
    if (trip.userId === userId) {
      throw new ConflictException('You are the owner of this trip');
    }

    const existingMember = await this.prisma.tripMember.findUnique({
      where: {
        userId_tripId: {
          userId,
          tripId: trip.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this trip');
    }

    // Add user as member
    const newMember = await this.prisma.tripMember.create({
      data: {
        userId,
        tripId: trip.id,
      },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            provinceId: true,
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
            startDate: true,
            endDate: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return newMember;
  }

  async acceptInvite(dto: AcceptInviteDto, userId: string) {
    const { token } = dto;

    const member = await this.prisma.tripMember.findFirst({
      where: { inviteToken: token, status: 'pending' },
      include: { trip: true },
    });

    if (!member) {
      throw new NotFoundException('Invalid or expired invite');
    }

    if (member.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chấp nhận lời mời này');
    }

    const updated = await this.prisma.tripMember.update({
      where: { id: member.id },
      data: {
        status: 'accepted',
        inviteToken: null,
        joinedAt: new Date(),
      },
      include: {
        user: { select: { id: true, email: true, fullName: true, profilePicture: true } },
        trip: { select: { id: true, title: true, provinceId: true, province: { select: { id: true, name: true, code: true, divisionType: true, codename: true, phoneCode: true } } } },
      },
    });

    return updated;
  }

  async revokeShareLink(tripId: string, requestUserId: string) {
    const trip = await this.findOne(tripId);

    // Check if user is trip owner
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can revoke share links');
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        shareToken: null,
        isPublic: false,
      },
    });
  }

  // ===== TRIP AVATAR MANAGEMENT =====

  async uploadTripAvatar(tripId: string, file: Express.Multer.File, requestUserId: string) {
    // Check if trip exists
    const trip = await this.findOne(tripId);

    // Check if the requesting user is the trip owner
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can upload trip avatar');
    }

    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and GIF images are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size cannot exceed 5MB');
    }

    try {
      // Upload to S3
      const uploadResult = await this.uploadService.uploadImage(file, {
        folder: `trip-avatars/${tripId}`,
        maxSize: maxSize,
        allowedTypes: allowedTypes,
      });

      // Update trip with new avatar URL
      const updatedTrip = await this.prisma.trip.update({
        where: { id: tripId },
        data: {
          avatar: uploadResult.url,
        },
      });

      return {
        success: true,
        message: 'Trip avatar uploaded successfully',
        data: {
          url: uploadResult.url,
          key: uploadResult.key,
          bucket: uploadResult.bucket,
        },
        trip: updatedTrip,
      };
    } catch (error) {
      console.error('Upload trip avatar error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload trip avatar');
    }
  }

  async deleteTripAvatar(tripId: string, requestUserId: string) {
    // Check if trip exists
    const trip = await this.findOne(tripId);

    // Check if the requesting user is the trip owner
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can delete trip avatar');
    }

    if (!trip.avatar) {
      throw new BadRequestException('Trip has no avatar to delete');
    }

    try {
      // Extract S3 key from URL
      const url = new URL(trip.avatar);
      const key = url.pathname.substring(1); // Remove leading slash

      // Delete from S3
      await this.uploadService.deleteFile(key);

      // Update trip to remove avatar
      const updatedTrip = await this.prisma.trip.update({
        where: { id: tripId },
        data: {
          avatar: null,
        },
      });

      return {
        success: true,
        message: 'Trip avatar deleted successfully',
        trip: updatedTrip,
      };
    } catch (error) {
      console.error('Delete trip avatar error:', error);
      throw new BadRequestException('Failed to delete trip avatar');
    }
  }

  async createTripFromTemplate(templateId: string, userId: string, tripTitle?: string) {
    // Get template data
    const template = await this.prisma.tripTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId }, // User's own template
          { isPublic: true } // Public template
        ]
      },
      include: {
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

    if (!template) {
      throw new NotFoundException('Trip template not found or not accessible');
    }

    // Create trip from template
    const tripData: CreateTripDto = {
      title: tripTitle || template.title,
      description: template.description,
      provinceId: template.provinceId,
      startDate: undefined, // Let user set dates later
      endDate: undefined
    };

    // Create the trip
    const trip = await this.create(tripData, userId);

    // Create days and activities from template
    if (template.days && template.days.length > 0) {
      for (const templateDay of template.days) {
        // Create day
        const day = await this.prisma.day.create({
          data: {
            title: templateDay.title,
            description: templateDay.description,
            date: new Date(), // Set to current date, user can modify later
            trip: { connect: { id: trip.id } }
          }
        });

        // Create activities for this day
        if (templateDay.activities && templateDay.activities.length > 0) {
          for (const templateActivity of templateDay.activities) {
            // Handle startTime properly - it might be stored as time string (HH:mm) or null
            let startTime = null;
            if (templateActivity.startTime) {
              // If startTime is a time string like "09:00", we need to create a proper date
              if (typeof templateActivity.startTime === 'string' && templateActivity.startTime.includes(':')) {
                // Create a date with today's date and the specified time
                const today = new Date();
                const [hours, minutes] = templateActivity.startTime.split(':');
                startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
              } else {
                // If it's already a date string, try to parse it
                const parsedDate = new Date(templateActivity.startTime);
                startTime = isNaN(parsedDate.getTime()) ? null : parsedDate;
              }
            }

            await this.prisma.activity.create({
              data: {
                title: templateActivity.title,
                startTime: startTime,
                durationMin: templateActivity.durationMin,
                location: templateActivity.location,
                notes: templateActivity.notes,
                important: templateActivity.important,
                day: { connect: { id: day.id } }
              }
            });
          }
        }
      }
    }

    // Return the created trip with full details
    return this.findOne(trip.id);
  }
}

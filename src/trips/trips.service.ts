import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
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
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly tripsRepository: TripsRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationService: EnhancedNotificationService,
    private readonly uploadService: UploadService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) { }

  async create(createTripDto: CreateTripDto, userId: string) {
    // Validate date if provided
    let startDate: Date | undefined;

    if (createTripDto.startDate) {
      startDate = new Date(createTripDto.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
    }

    // Create trip and add creator as admin member in a transaction
    const trip = await this.prisma.$transaction(async (prisma) => {
      // Create the trip
      const tripData: any = {
        title: createTripDto.title,
        description: createTripDto.description,
        startDate: startDate,
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
            activities: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        members: {
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

    // Validate date if provided
    if (updateTripDto.startDate) {
      const startDate = new Date(updateTripDto.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
      data.startDate = startDate;
    } else if (updateTripDto.startDate === null) { // Explicitly handle null to clear date
      data.startDate = null;
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

    const members = await this.prisma.tripMember.findMany({
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

    // Map members để handle case user chưa tồn tại
    return members.map(member => ({
      ...member,
      user: member.user || {
        id: null,
        email: member.invitedEmail || '',
        fullName: null,
        profilePicture: null,
      },
    }));
  }

  async addMemberToTrip(tripId: string, addMemberDto: AddMemberDto, requestUserId: string) {
    const trip = await this.findOne(tripId);

    // Chỉ chủ sở hữu mới được thêm thành viên
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can add members');
    }

    // Find user by email (case-insensitive)
    const normalizedEmail = addMemberDto.email.toLowerCase();
    const userToAdd = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Check if user is already a member or has a pending invitation
    let existingMember: any = null;

    if (userToAdd) {
      existingMember = await this.prisma.tripMember.findUnique({
        where: {
          userId_tripId: {
            userId: userToAdd.id,
            tripId: tripId,
          },
        },
      });
    } else {
      // Check by email if user doesn't exist yet
      existingMember = await this.prisma.tripMember.findFirst({
        where: {
          tripId: tripId,
          invitedEmail: {
            equals: normalizedEmail,
            mode: 'insensitive'
          },
          status: 'pending',
        },
      });
    }

    if (existingMember && existingMember.status === 'accepted') {
      throw new ConflictException('User is already a member of this trip');
    }

    // Tạo lời mời mới hoặc cập nhật lời mời hiện có
    const inviteToken = randomBytes(32).toString('hex');
    let member;

    try {
      if (existingMember) {
        // Cập nhật lời mời hiện có (status must be pending here)
        member = await this.prisma.tripMember.update({
          where: { id: existingMember.id },
          data: {
            inviteToken,
            invitedAt: new Date(),
            invitedById: requestUserId,
            invitedEmail: normalizedEmail,
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
      } else {
        // Tạo lời mời mới
        member = await this.prisma.tripMember.create({
          data: {
            userId: userToAdd?.id || null,
            tripId: tripId,
            status: 'pending',
            inviteToken,
            invitedAt: new Date(),
            invitedById: requestUserId,
            invitedEmail: normalizedEmail,
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
      }

      // Lấy thông tin người mời
      const inviter = await this.prisma.user.findUnique({
        where: { id: requestUserId },
        select: { fullName: true, email: true },
      });

      // Gửi notification và email qua queue
      const frontendUrl = this.configService.get<string>('APP_URL');
      if (!frontendUrl) {
        this.logger.error('APP_URL is not set in environment variables');
      }

      await this.notificationService.sendTripInvitationNotification(
        tripId,
        trip.title,
        userToAdd?.id || '',
        inviter?.fullName || inviter?.email || 'Một người bạn',
        {
          skipEmail: false,
          data: {
            userEmail: normalizedEmail,
            userName: userToAdd?.fullName || addMemberDto.email.split('@')[0],
            inviteeName: userToAdd?.fullName || addMemberDto.email.split('@')[0],
            acceptUrl: `${frontendUrl}/invite?token=${inviteToken}`
          }
        }
      );

      // Return với user info hoặc email
      return {
        ...member,
        user: member.user || {
          id: null,
          email: normalizedEmail,
          fullName: null,
          profilePicture: null,
        },
      };
    } catch (error: any) {
      console.error('Error in addMemberToTrip:', error);
      if (error.code === 'P2002' || error.message?.includes('null value') || error.message?.includes('NOT NULL')) {
        throw new BadRequestException(
          'Database schema chưa được cập nhật hoặc có lỗi xung đột dữ liệu.'
        );
      }
      throw error;
    }
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

  async resendInvitation(tripId: string, memberId: string, requestUserId: string) {
    const trip = await this.findOne(tripId);

    // Check if user is trip owner
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can resend invitations');
    }

    const member = await this.prisma.tripMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        trip: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!member || member.tripId !== tripId) {
      throw new NotFoundException('Member not found in this trip');
    }

    // Only resend for pending invitations
    if (member.status !== 'pending') {
      throw new BadRequestException('Can only resend invitations for pending members');
    }

    // Generate new invite token
    const newInviteToken = randomBytes(32).toString('hex');

    // Update member with new token and reset invitedAt
    const updatedMember = await this.prisma.tripMember.update({
      where: { id: memberId },
      data: {
        inviteToken: newInviteToken,
        invitedAt: new Date(),
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

    // Get inviter info
    const inviter = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { fullName: true, email: true },
    });

    // Get email to send to
    const emailToSend = member.invitedEmail || member.user?.email;
    if (!emailToSend) {
      throw new BadRequestException('No email found for this invitation');
    }

    // Gửi notification và email qua queue
    const frontendUrl = this.configService.get<string>('APP_URL');
    if (!frontendUrl) {
      this.logger.error('APP_URL is not set in environment variables');
    }

    await this.notificationService.sendTripInvitationNotification(
      tripId,
      trip.title,
      member.userId || '',
      inviter?.fullName || inviter?.email || 'Một người bạn',
      {
        skipEmail: false,
        data: {
          userEmail: emailToSend,
          userName: member.user?.fullName || emailToSend.split('@')[0],
          inviteeName: member.user?.fullName || emailToSend.split('@')[0],
          acceptUrl: `${frontendUrl}/invite?token=${newInviteToken}`
        }
      }
    );

    return updatedMember;
  }

  // ===== SHARE LINK FUNCTIONALITY =====

  async generateShareLink(tripId: string, requestUserId: string) {
    const trip = await this.findOne(tripId);

    // Check if user is trip owner
    if (trip.userId !== requestUserId) {
      throw new ForbiddenException('Only trip owner can generate share links');
    }

    // Generate unique share token
    const shareToken = randomBytes(6).toString('hex');

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

    // Get user info to check email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member or has a pending invitation
    // We check both by userId and by their email (case-insensitive)
    const existingMember = await this.prisma.tripMember.findFirst({
      where: {
        tripId: trip.id,
        OR: [
          { userId: userId },
          {
            invitedEmail: { equals: user.email, mode: 'insensitive' },
            userId: null // Only check those not yet linked to an account
          }
        ]
      },
      orderBy: { status: 'asc' } // 'accepted' comes before 'pending' alphabetically
    });

    if (existingMember) {
      if (existingMember.status === 'accepted') {
        throw new ConflictException('You are already a member of this trip');
      }

      // If it's pending, update it to accepted
      return this.prisma.tripMember.update({
        where: { id: existingMember.id },
        data: {
          userId: userId,
          status: 'accepted',
          joinedAt: new Date(),
          inviteToken: null,
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
    }

    // Add user as member if no record exists
    const newMember = await this.prisma.tripMember.create({
      data: {
        userId,
        tripId: trip.id,
        status: 'accepted',
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

  /**
   * Get invitation details by token (public endpoint, no auth required)
   */
  async getInvitationByToken(token: string) {
    const member = await this.prisma.tripMember.findFirst({
      where: {
        inviteToken: token,
        status: 'pending',
      },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            province: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
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

    if (!member) {
      throw new NotFoundException('Invalid or expired invite');
    }

    return {
      id: member.id,
      tripId: member.tripId,
      invitedEmail: member.invitedEmail || member.user?.email,
      trip: member.trip,
      inviter: member.trip.user,
      status: member.status,
    };
  }

  async acceptInvite(dto: AcceptInviteDto, userId: string) {
    const { token } = dto;

    // Get user email to match with invitedEmail if userId is null
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // First, find the member by token and status only
    // The token itself is the proof of invitation
    const member = await this.prisma.tripMember.findFirst({
      where: {
        inviteToken: token,
        status: 'pending',
      },
      include: { trip: true },
    });

    if (!member) {
      throw new NotFoundException('Invalid or expired invite');
    }

    // Link userId if not already linked
    if (member.userId) {
      if (member.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền chấp nhận lời mời này');
      }
    } else {
      // Check if user is already a member (direct add or via other invite/share)
      const existingMember = await this.prisma.tripMember.findUnique({
        where: {
          userId_tripId: {
            userId: userId,
            tripId: member.tripId,
          },
        },
      });

      if (existingMember) {
        // If they are already a member, we can't have two records for the same user-trip combination.
        // We delete the current pending one (found by token) and proceed with the existing one.
        await this.prisma.tripMember.delete({
          where: { id: member.id },
        });

        // Re-assign member to the existing one so the next update works on it
        Object.assign(member, existingMember);
      } else {
        // Member doesn't have userId yet, link it now
        // If invitedEmail exists and doesn't match, log warning but still allow (token is proof)
        if (member.invitedEmail && member.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
          console.warn(`Email mismatch for invite: invitedEmail=${member.invitedEmail}, userEmail=${user.email}, but token is valid`);
        }
        await this.prisma.tripMember.update({
          where: { id: member.id },
          data: { userId: userId },
        });
      }
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

  /**
   * Link pending invitations by email when user registers/logs in
   */
  async linkPendingInvitationsByEmail(userId: string, email: string) {
    const normalizedEmail = email.toLowerCase();
    // Find all pending invitations for this email (case-insensitive)
    const pendingInvitations = await this.prisma.tripMember.findMany({
      where: {
        OR: [
          {
            invitedEmail: {
              equals: normalizedEmail,
              mode: 'insensitive'
            }
          },
          {
            user: {
              email: {
                equals: normalizedEmail,
                mode: 'insensitive'
              }
            }
          }
        ],
        status: 'pending',
        userId: null, // Only link invitations that don't have userId yet
      },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Update each invitation to link with the user
    for (const invitation of pendingInvitations) {
      try {
        // Double check if user is already a member of this trip (race condition or duplicate invites)
        const existingMember = await this.prisma.tripMember.findUnique({
          where: {
            userId_tripId: {
              userId: userId,
              tripId: invitation.tripId,
            },
          },
        });

        if (existingMember) {
          // If they are already a member, delete this duplicate pending invitation
          await this.prisma.tripMember.delete({
            where: { id: invitation.id },
          });
          continue;
        }

        await this.prisma.tripMember.update({
          where: { id: invitation.id },
          data: {
            userId: userId,
          },
        });

        // Send notification to the newly registered user
        const trip = (invitation as any).trip as { id: string; title: string } | undefined;
        if (trip) {
          void this.notificationService.sendTripInvitationNotification(
            invitation.tripId,
            trip.title,
            userId,
            undefined,
            { skipEmail: true } // Email đã được gửi trước đó
          );
        }
      } catch (error) {
        // Handle potential unique constraint errors if findUnique didn't catch it
        console.error(`Error linking invitation ${invitation.id}:`, error);
      }
    }

    return {
      linkedCount: pendingInvitations.length,
      invitations: pendingInvitations,
    };
  }

  async acceptInviteByMemberId(tripId: string, memberId: string, userId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { id: memberId },
      include: { trip: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.tripId !== tripId) {
      throw new ForbiddenException('Member does not belong to this trip');
    }

    if (member.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chấp nhận lời mời này');
    }

    if (member.status !== 'pending') {
      throw new BadRequestException('Invitation is not pending');
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
        acl: 'public-read', // Set public read access for trip avatars
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
        isPublic: true
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
      startDate: undefined // Let user set date later
    };

    // Create the trip
    const trip = await this.create(tripData, userId);

    // Copy avatar from template if exists
    if (template.avatar) {
      try {
        const url = new URL(template.avatar);
        const bucketName = this.uploadService.getBucketName();
        const endpoint = this.configService.get('S3_ENDPOINT');

        // If the avatar is from our S3 bucket, copy it
        if (template.avatar.includes(bucketName) || (endpoint && template.avatar.includes(endpoint))) {
          // Extract S3 key from URL
          let sourceKey = url.pathname.substring(1);
          // If pathname starts with bucket name, strip it
          if (sourceKey.startsWith(`${bucketName}/`)) {
            sourceKey = sourceKey.substring(bucketName.length + 1);
          }

          // Generate a unique filename to avoid collisions
          const extension = path.extname(sourceKey) || '.jpg';
          const fileName = `avatar-${Date.now()}${extension}`;
          const targetKey = `trip-avatars/${trip.id}/${fileName}`;

          const copyResult = await this.uploadService.copyFile(sourceKey, targetKey);

          // Update trip with new avatar URL
          await this.prisma.trip.update({
            where: { id: trip.id },
            data: { avatar: copyResult.url }
          });
        } else {
          // If it's an external URL, just copy the URL
          await this.prisma.trip.update({
            where: { id: trip.id },
            data: { avatar: template.avatar }
          });
        }
      } catch (error) {
        this.logger.error(`Failed to handle template avatar: ${error.message}`);
        // Don't throw error to avoid breaking trip creation
      }
    }

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
                sortOrder: templateActivity.activityOrder,
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

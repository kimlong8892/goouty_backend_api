import { Injectable, ConflictException, UnauthorizedException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EnhancedNotificationService } from '../notifications/enhanced-notification.service';
import { TranslationService } from '../common/i18n/translation.service';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationService: EnhancedNotificationService,
    private i18n: TranslationService,
    @Inject(forwardRef(() => TripsService))
    private tripsService: any, // Use any to avoid circular dependency type issues
  ) { }

  async register(registerDto: RegisterDto) {
    const { password, fullName } = registerDto;
    const normalizedEmail = registerDto.email.toLowerCase();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        this.i18n.t('auth.register.emailExists')
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user - use upsert to prevent race conditions
    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {}, // No update if exists
      create: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
      },
    });

    // Link pending trip invitations for this email
    try {
      await (this.tripsService as any).linkPendingInvitationsByEmail(user.id, normalizedEmail);
    } catch (error) {
      // Log but don't fail registration if linking invitations fails
      console.error('Failed to link pending invitations:', error);
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      accessToken: token,
    };
  }

  async login(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email.toLowerCase();
    const { password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('auth.login.invalidCredentials')
      );
    }

    // Check if user has password (not a social login only user)
    if (!user.password) {
      throw new UnauthorizedException(
        this.i18n.t('auth.login.useSocialLogin')
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('auth.login.invalidCredentials')
      );
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      accessToken: token,
    };
  }

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.password && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('Email không tồn tại trong hệ thống');
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires,
      },
    });

    // Send email directly
    await this.notificationService.sendCustomNotification(
      'FORGOT_PASSWORD',
      {
        resetToken,
        frontendUrl: process.env.APP_URL,
      },
      [user.id],
      {
        skipPush: true,
      },
    );

    return { message: 'If email exists, a reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }
}

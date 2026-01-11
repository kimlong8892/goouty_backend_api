import { Injectable, UnauthorizedException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthDto, GoogleAuthResponseDto } from './dto/google-auth.dto';
import { TripsService } from '../trips/trips.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SocialLoginService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => TripsService))
    private tripsService: any, // Use any to avoid circular dependency type issues
  ) { }

  /**
   * Verify Google ID token and extract user information
   */
  private async verifyGoogleToken(credential: string): Promise<any> {
    try {
      // For development, we'll decode the JWT token
      // In production, you should verify with Google's servers using google-auth-library
      const decoded = jwt.decode(credential) as any;

      if (!decoded || !decoded.sub || !decoded.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      // Basic validation
      if (!decoded.aud || !decoded.iss) {
        throw new UnauthorizedException('Invalid token structure');
      }

      // Check if email is verified
      if (!decoded.email_verified) {
        throw new UnauthorizedException('Email not verified by Google');
      }

      return {
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        emailVerified: decoded.email_verified,
        aud: decoded.aud,
        iss: decoded.iss,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  /**
   * Handle Google OAuth login/registration
   */
  async handleGoogleAuth(googleAuthDto: GoogleAuthDto): Promise<GoogleAuthResponseDto> {
    const { credential, googleId, email, fullName, picture } = googleAuthDto;
    const normalizedEmail = email.toLowerCase();

    // Verify the Google token
    const googleUserInfo = await this.verifyGoogleToken(credential);

    // Validate that the provided data matches the token
    if (googleUserInfo.googleId !== googleId || googleUserInfo.email.toLowerCase() !== normalizedEmail) {
      throw new UnauthorizedException('Token data mismatch');
    }

    // Check if social account already exists
    const existingSocialAccount = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'google',
          providerId: googleId,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingSocialAccount) {
      // User already exists, return token
      const token = this.generateToken(existingSocialAccount.user.id, existingSocialAccount.user.email);

      return {
        id: existingSocialAccount.user.id,
        email: existingSocialAccount.user.email,
        fullName: existingSocialAccount.user.fullName || fullName,
        accessToken: token,
        isNewUser: false,
      };
    }

    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let user;
    let isNewUser = false;

    if (existingUser) {
      // User exists but doesn't have Google account linked
      user = existingUser;

      // Update user info if needed
      if (!user.fullName && fullName) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            fullName,
            profilePicture: picture || user.profilePicture,
          },
        });
      }
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName,
          profilePicture: picture,
          // password is null for social login users
        },
      });
      isNewUser = true;
    }

    // Create social account link
    await this.prisma.socialAccount.create({
      data: {
        provider: 'google',
        providerId: googleId,
        email: normalizedEmail,
        name: fullName,
        picture,
        userId: user.id,
      },
    });

    // Link pending trip invitations for this email (if new user)
    if (isNewUser) {
      try {
        await (this.tripsService as any).linkPendingInvitationsByEmail(user.id, normalizedEmail);
      } catch (error) {
        // Log but don't fail registration if linking invitations fails
        console.error('Failed to link pending invitations:', error);
      }
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || fullName,
      accessToken: token,
      isNewUser,
    };
  }

  /**
   * Link additional social account to existing user
   */
  async linkSocialAccount(userId: string, provider: string, providerData: any): Promise<void> {
    const existingLink = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: providerData.providerId,
        },
      },
    });

    if (existingLink) {
      throw new ConflictException('Social account already linked');
    }

    await this.prisma.socialAccount.create({
      data: {
        provider,
        providerId: providerData.providerId,
        email: providerData.email,
        name: providerData.name,
        picture: providerData.picture,
        userId,
      },
    });
  }

  /**
   * Get all social accounts for a user
   */
  async getUserSocialAccounts(userId: string) {
    return this.prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        name: true,
        picture: true,
        createdAt: true,
      },
    });
  }

  /**
   * Unlink social account from user
   */
  async unlinkSocialAccount(userId: string, socialAccountId: string): Promise<void> {
    const socialAccount = await this.prisma.socialAccount.findFirst({
      where: {
        id: socialAccountId,
        userId,
      },
    });

    if (!socialAccount) {
      throw new UnauthorizedException('Social account not found');
    }

    // Check if user has password or other social accounts
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialAccounts: true,
      },
    });

    if (!user.password && user.socialAccounts.length <= 1) {
      throw new ConflictException('Cannot unlink the only login method');
    }

    await this.prisma.socialAccount.delete({
      where: { id: socialAccountId },
    });
  }

  /**
   * Handle Google OAuth callback with authorization code
   */
  async handleGoogleCallback(code: string, redirectUri: string): Promise<GoogleAuthResponseDto> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new UnauthorizedException('Google OAuth not configured');
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Token exchange error:', errorData);
        throw new UnauthorizedException('Failed to exchange authorization code');
      }

      const tokenData = await tokenResponse.json();
      const { access_token, id_token } = tokenData;

      // Get user info from Google using access token
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new UnauthorizedException('Failed to get user info from Google');
      }

      const userData = await userResponse.json();

      // Create GoogleAuthDto with real data
      const googleAuthDto: GoogleAuthDto = {
        credential: id_token,
        googleId: userData.id,
        email: userData.email,
        fullName: userData.name,
        picture: userData.picture,
      };

      // Use existing handleGoogleAuth method
      return this.handleGoogleAuth(googleAuthDto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Google callback error:', error);
      throw new UnauthorizedException('Failed to process Google callback');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload, { expiresIn: '365d' });
  }
}

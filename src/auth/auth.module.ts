import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SocialLoginService } from './social-login.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { NotificationModule } from '../notifications/notification.module';
import { I18nHelperModule } from '../common/i18n/i18n-helper.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    NotificationModule,
    I18nHelperModule,
    forwardRef(() => TripsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, SocialLoginService, JwtStrategy, LocalStrategy],
  exports: [AuthService, SocialLoginService],
})
export class AuthModule { }

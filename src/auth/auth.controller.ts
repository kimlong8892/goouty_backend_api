import { Controller, Post, Body, HttpCode, HttpStatus, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SocialLoginService } from './social-login.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto, GoogleAuthResponseDto } from './dto/google-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordOtpDto } from './dto/change-password-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly socialLoginService: SocialLoginService,
  ) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/Register with Google OAuth' })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated with Google',
    type: GoogleAuthResponseDto
  })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  @ApiResponse({ status: 409, description: 'Email already registered with different method' })
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto): Promise<GoogleAuthResponseDto> {
    return this.socialLoginService.handleGoogleAuth(googleAuthDto);
  }

  @Get('social-accounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user social accounts' })
  @ApiResponse({ status: 200, description: 'Social accounts retrieved successfully' })
  async getSocialAccounts(@Request() req) {
    return this.socialLoginService.getUserSocialAccounts(req.user.userId);
  }

  @Delete('social-accounts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink social account' })
  @ApiResponse({ status: 200, description: 'Social account unlinked successfully' })
  @ApiResponse({ status: 409, description: 'Cannot unlink the only login method' })
  async unlinkSocialAccount(@Request() req, @Param('id') socialAccountId: string) {
    await this.socialLoginService.unlinkSocialAccount(req.user.userId, socialAccountId);
    return { message: 'Social account unlinked successfully' };
  }

  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Google OAuth callback with authorization code' })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated with Google',
    type: GoogleAuthResponseDto
  })
  @ApiResponse({ status: 401, description: 'Invalid authorization code' })
  async googleCallback(@Body() body: { code: string; redirectUri: string }): Promise<GoogleAuthResponseDto> {
    return this.socialLoginService.handleGoogleCallback(body.code, body.redirectUri);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for password reset' })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async requestOtp(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestOtp(forgotPasswordDto);
  }

  @Post('change-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password with OTP' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async changePasswordOtp(@Body() changePasswordOtpDto: ChangePasswordOtpDto) {
    return this.authService.changePasswordWithOtp(changePasswordOtpDto);
  }

}

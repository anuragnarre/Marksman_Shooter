// apps/api/src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponse, JwtPayload } from '@shooting-platform/shared-types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // SEC-03: Stricter rate limit for auth endpoints (5 req/min vs global 100/min)
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleLogin(@Body() dto: GoogleAuthDto): Promise<AuthResponse> {
    return this.authService.googleLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string },
  ) {
    return this.authService.updateProfile(user.sub, body.name);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      user.sub,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.authService.deleteAccount(user.sub);
  }

  @Get('me/data-export')
  @UseGuards(JwtAuthGuard)
  async exportData(@CurrentUser() user: JwtPayload) {
    return this.authService.exportUserData(user.sub);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() body: { refresh_token: string }) {
    if (!body.refresh_token) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshTokens(body.refresh_token);
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generate2FaSecret(@CurrentUser() user: JwtPayload) {
    return this.authService.generate2FaSecret(user.sub);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify2Fa(@CurrentUser() user: JwtPayload, @Body() body: { token: string }) {
    return this.authService.verify2Fa(user.sub, body.token);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2Fa(@CurrentUser() user: JwtPayload) {
    return this.authService.disable2Fa(user.sub);
  }
}

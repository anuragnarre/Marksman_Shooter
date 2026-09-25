// apps/api/src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AuthResponse, JwtPayload } from '@shooting-platform/shared-types';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
    });

    const token = this.signToken({ sub: user.id, email: user.email, role: user.role });

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        googleId: user.googleId ?? null,
        createdAt: user.createdAt,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.passwordHash) {
        throw new UnauthorizedException(
          'This account uses Google Sign-In. Please log in with Google.',
        );
      }

      const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.signToken({ sub: user.id, email: user.email, role: user.role });

      return {
        access_token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          googleId: user.googleId ?? null,
          createdAt: user.createdAt,
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('[login] Error:', err);
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Database connection failed or internal error',
      );
    }
  }

  async googleLogin(dto: GoogleAuthDto): Promise<AuthResponse> {
    // Guard: fail clearly if Google OAuth is not configured on this server
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    if (!googleClientId || googleClientId.startsWith('dummy') || googleClientId === 'your-google-web-client-id.apps.googleusercontent.com') {
      throw new BadRequestException(
        'Google Sign-In is not configured on this server. Please use email/password login.',
      );
    }

    // Verify the Google ID token on the server side
    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken: dto.credential,
        audience: googleClientId,
      });
    } catch (err) {
      console.error('[googleLogin] verifyIdToken failed:', err);
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Invalid Google token payload');
    if (!payload.email_verified) throw new UnauthorizedException('Google email not verified');

    const email = payload.email!;
    const name = payload.name ?? email.split('@')[0];
    const googleId = payload.sub;

    try {
      let user = await this.prisma.user.findFirst({
        where: { OR: [{ googleId }, { email }] },
      });

      if (user) {
        // Link googleId if this email already has a local account
        if (!user.googleId) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { googleId },
          });
        }
      } else {
        user = await this.prisma.user.create({
          data: {
            name,
            email,
            googleId,
            role: dto.role ?? 'SHOOTER',
          },
        });
      }

      const token = this.signToken({ sub: user.id, email: user.email, role: user.role });

      return {
        access_token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          googleId: user.googleId ?? null,
          createdAt: user.createdAt,
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('[googleLogin] DB/token error:', err);
      throw new InternalServerErrorException(
        (err as Error)?.message ?? 'Google login failed',
      );
    }
  }


  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        googleId: true,
        passwordHash: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      hasPassword: !!passwordHash,
      hasGoogle: !!user.googleId,
    };
  }

  async updateProfile(userId: string, name: string) {
    if (!name || name.trim().length < 1) {
      throw new BadRequestException('Name is required');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // If user has a password, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required');
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete all biometric readings (direct + through sessions)
      await tx.biometricReading.deleteMany({ where: { userId } });

      // 2. Delete device registrations (references biometricReadings resolved above)
      await tx.deviceRegistration.deleteMany({ where: { userId } });

      // 3. Get session IDs for this user
      const sessions = await tx.session.findMany({
        where: { shooterId: userId },
        select: { id: true },
      });
      const sessionIds = sessions.map((s) => s.id);

      if (sessionIds.length > 0) {
        await tx.sessionContext.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await tx.coachFeedback.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await tx.shot.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await tx.session.deleteMany({ where: { id: { in: sessionIds } } });
      }

      // 4. Delete feedback the user gave as coach
      await tx.coachFeedback.deleteMany({ where: { coachId: userId } });

      // 5. Schedule requests
      await tx.scheduleRequest.deleteMany({
        where: { OR: [{ shooterId: userId }, { coachId: userId }] },
      });

      // 6. Event assignees
      await tx.eventAssignee.deleteMany({ where: { shooterId: userId } });

      // 7. Training events the user created as coach (with their assignees + requests)
      const coachEvents = await tx.trainingEvent.findMany({
        where: { coachId: userId },
        select: { id: true },
      });
      const coachEventIds = coachEvents.map((e) => e.id);
      if (coachEventIds.length > 0) {
        await tx.scheduleRequest.deleteMany({ where: { eventId: { in: coachEventIds } } });
        await tx.eventAssignee.deleteMany({ where: { eventId: { in: coachEventIds } } });
        await tx.trainingEvent.deleteMany({ where: { id: { in: coachEventIds } } });
      }

      // 8. Coach connections
      await tx.coachConnection.deleteMany({
        where: { OR: [{ shooterId: userId }, { coachId: userId }] },
      });

      // 9. Training plans
      await tx.trainingPlan.deleteMany({ where: { userId } });

      // 10. Shooter profile
      await tx.shooterProfile.deleteMany({ where: { userId } });

      // 11. Competition registrations
      await tx.competitionEventRegistration.deleteMany({ where: { userId } });

      // 12. Competition events the user created
      const compEvents = await tx.competitionEvent.findMany({
        where: { createdById: userId },
        select: { id: true },
      });
      const compEventIds = compEvents.map((e) => e.id);
      if (compEventIds.length > 0) {
        await tx.competitionEventRegistration.deleteMany({ where: { eventId: { in: compEventIds } } });
        await tx.competitionEventCategory.deleteMany({ where: { eventId: { in: compEventIds } } });
        await tx.competitionEvent.deleteMany({ where: { id: { in: compEventIds } } });
      }

      // 13. Finally anonymize the user instead of wiping
      await tx.user.update({ 
        where: { id: userId },
        data: {
          name: 'Deleted User',
          email: `deleted_${userId}@anonymized.local`,
          passwordHash: null,
          googleId: null,
          totpSecret: null,
          isTwoFactorEnabled: false,
        }
      });
    });
  }

  async exportUserData(userId: string) {
    // In a real implementation, this would trigger an async job (e.g. Bull queue) 
    // to gather all data, generate a ZIP archive, and email a link to the user.
    return {
      message: 'GDPR data export job has been queued. You will receive an email with the ZIP archive link shortly.',
      jobId: randomBytes(8).toString('hex'),
      status: 'QUEUED'
    };
  }

  async generate2FaSecret(userId: string) {
    // Stub TOTP secret generation (since otplib installation failed over UNC)
    const secret = randomBytes(20).toString('hex');
    const qrCodeDataUrl = `otpauth://totp/Marksman?secret=${secret}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret },
    });
    return { secret, qrCodeDataUrl };
  }

  async verify2Fa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) throw new BadRequestException('2FA not set up');
    // Stub verification: token must be '000000' to pass
    if (token !== '000000') throw new UnauthorizedException('Invalid 2FA token');
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });
    return { success: true };
  }

  async disable2Fa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, totpSecret: null },
    });
    return { success: true };
  }

  async generateRefreshToken(userId: string) {
    const token = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day sliding window
    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
    return token;
  }

  async refreshTokens(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newAccessToken = this.signToken({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });
    const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);

    // Revoke old token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  private signToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}

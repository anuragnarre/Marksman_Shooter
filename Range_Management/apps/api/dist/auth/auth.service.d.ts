import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AuthResponse } from '@shooting-platform/shared-types';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly googleClient;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    googleLogin(dto: GoogleAuthDto): Promise<AuthResponse>;
    getProfile(userId: string): Promise<{
        hasPassword: boolean;
        hasGoogle: boolean;
        name: string;
        id: string;
        email: string;
        googleId: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updateProfile(userId: string, name: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string): Promise<void>;
    exportUserData(userId: string): Promise<{
        message: string;
        jobId: string;
        status: string;
    }>;
    generate2FaSecret(userId: string): Promise<{
        secret: string;
        qrCodeDataUrl: string;
    }>;
    verify2Fa(userId: string, token: string): Promise<{
        success: boolean;
    }>;
    disable2Fa(userId: string): Promise<{
        success: boolean;
    }>;
    generateRefreshToken(userId: string): Promise<string>;
    refreshTokens(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    private signToken;
}

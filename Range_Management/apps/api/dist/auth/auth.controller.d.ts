import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AuthResponse, JwtPayload } from '@shooting-platform/shared-types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    googleLogin(dto: GoogleAuthDto): Promise<AuthResponse>;
    getProfile(user: JwtPayload): Promise<{
        hasPassword: boolean;
        hasGoogle: boolean;
        name: string;
        id: string;
        email: string;
        googleId: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updateProfile(user: JwtPayload, body: {
        name: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    changePassword(user: JwtPayload, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    deleteAccount(user: JwtPayload): Promise<void>;
    exportData(user: JwtPayload): Promise<{
        message: string;
        jobId: string;
        status: string;
    }>;
    refreshTokens(body: {
        refresh_token: string;
    }): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    generate2FaSecret(user: JwtPayload): Promise<{
        secret: string;
        qrCodeDataUrl: string;
    }>;
    verify2Fa(user: JwtPayload, body: {
        token: string;
    }): Promise<{
        success: boolean;
    }>;
    disable2Fa(user: JwtPayload): Promise<{
        success: boolean;
    }>;
}

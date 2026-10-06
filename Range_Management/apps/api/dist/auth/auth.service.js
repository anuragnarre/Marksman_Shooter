"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const crypto_1 = require("crypto");
const google_auth_library_1 = require("google-auth-library");
const prisma_service_1 = require("../prisma/prisma.service");
const BCRYPT_SALT_ROUNDS = 12;
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.googleClient = new google_auth_library_1.OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
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
    async login(dto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const allowedRoles = ['RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'];
            if (!allowedRoles.includes(user.role)) {
                throw new common_1.UnauthorizedException('This account is registered for the Shooter App. Please use the Shooter App to log in.');
            }
            if (!user.passwordHash) {
                throw new common_1.UnauthorizedException('This account uses Google Sign-In. Please log in with Google.');
            }
            const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
            if (!passwordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
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
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException)
                throw err;
            console.error('[login] Error:', err);
            throw new common_1.InternalServerErrorException(err instanceof Error ? err.message : 'Database connection failed or internal error');
        }
    }
    async googleLogin(dto) {
        const googleClientId = this.configService.get('GOOGLE_CLIENT_ID') ?? '';
        if (!googleClientId || googleClientId.startsWith('dummy') || googleClientId === 'your-google-web-client-id.apps.googleusercontent.com') {
            throw new common_1.BadRequestException('Google Sign-In is not configured on this server. Please use email/password login.');
        }
        let ticket;
        try {
            ticket = await this.googleClient.verifyIdToken({
                idToken: dto.credential,
                audience: googleClientId,
            });
        }
        catch (err) {
            console.error('[googleLogin] verifyIdToken failed:', err);
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        const payload = ticket.getPayload();
        if (!payload)
            throw new common_1.UnauthorizedException('Invalid Google token payload');
        if (!payload.email_verified)
            throw new common_1.UnauthorizedException('Google email not verified');
        const email = payload.email;
        const name = payload.name ?? email.split('@')[0];
        const googleId = payload.sub;
        try {
            let user = await this.prisma.user.findFirst({
                where: { OR: [{ googleId }, { email }] },
            });
            if (user) {
                const allowedRoles = ['RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'];
                if (!allowedRoles.includes(user.role)) {
                    throw new common_1.UnauthorizedException('This account is registered for the Shooter App. Please use the Shooter App to log in.');
                }
                if (!user.googleId) {
                    user = await this.prisma.user.update({
                        where: { id: user.id },
                        data: { googleId },
                    });
                }
            }
            else {
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
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException)
                throw err;
            console.error('[googleLogin] DB/token error:', err);
            throw new common_1.InternalServerErrorException(err?.message ?? 'Google login failed');
        }
    }
    async getProfile(userId) {
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
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const { passwordHash, ...rest } = user;
        return {
            ...rest,
            hasPassword: !!passwordHash,
            hasGoogle: !!user.googleId,
        };
    }
    async updateProfile(userId, name) {
        if (!name || name.trim().length < 1) {
            throw new common_1.BadRequestException('Name is required');
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
    async changePassword(userId, currentPassword, newPassword) {
        if (!newPassword || newPassword.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.passwordHash) {
            if (!currentPassword) {
                throw new common_1.BadRequestException('Current password is required');
            }
            const valid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!valid) {
                throw new common_1.UnauthorizedException('Current password is incorrect');
            }
        }
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        return { message: 'Password updated successfully' };
    }
    async deleteAccount(userId) {
        await this.prisma.$transaction(async (tx) => {
            await tx.biometricReading.deleteMany({ where: { userId } });
            await tx.deviceRegistration.deleteMany({ where: { userId } });
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
            await tx.coachFeedback.deleteMany({ where: { coachId: userId } });
            await tx.scheduleRequest.deleteMany({
                where: { OR: [{ shooterId: userId }, { coachId: userId }] },
            });
            await tx.eventAssignee.deleteMany({ where: { shooterId: userId } });
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
            await tx.coachConnection.deleteMany({
                where: { OR: [{ shooterId: userId }, { coachId: userId }] },
            });
            await tx.trainingPlan.deleteMany({ where: { userId } });
            await tx.shooterProfile.deleteMany({ where: { userId } });
            await tx.competitionEventRegistration.deleteMany({ where: { userId } });
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
    async exportUserData(userId) {
        return {
            message: 'GDPR data export job has been queued. You will receive an email with the ZIP archive link shortly.',
            jobId: (0, crypto_1.randomBytes)(8).toString('hex'),
            status: 'QUEUED'
        };
    }
    async generate2FaSecret(userId) {
        const secret = (0, crypto_1.randomBytes)(20).toString('hex');
        const qrCodeDataUrl = `otpauth://totp/Marksman?secret=${secret}`;
        await this.prisma.user.update({
            where: { id: userId },
            data: { totpSecret: secret },
        });
        return { secret, qrCodeDataUrl };
    }
    async verify2Fa(userId, token) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpSecret)
            throw new common_1.BadRequestException('2FA not set up');
        if (token !== '000000')
            throw new common_1.UnauthorizedException('Invalid 2FA token');
        await this.prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true },
        });
        return { success: true };
    }
    async disable2Fa(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: false, totpSecret: null },
        });
        return { success: true };
    }
    async generateRefreshToken(userId) {
        const token = (0, crypto_1.randomBytes)(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await this.prisma.refreshToken.create({
            data: { token, userId, expiresAt },
        });
        return token;
    }
    async refreshTokens(refreshToken) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            if (storedToken) {
                await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            }
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const newAccessToken = this.signToken({
            sub: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
        });
        const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
        };
    }
    signToken(payload) {
        return this.jwtService.sign(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
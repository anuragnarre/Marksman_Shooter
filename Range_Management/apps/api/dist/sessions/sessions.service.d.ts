import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../ranges/weather.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Session, UserRole } from '@shooting-platform/shared-types';
export declare class SessionsService {
    private readonly prisma;
    private readonly weatherService;
    constructor(prisma: PrismaService, weatherService: WeatherService);
    createForActor(actorId: string, role: UserRole, dto: CreateSessionDto, shooterId?: string): Promise<Session>;
    findAllForActor(actorId: string, role: UserRole, shooterId?: string): Promise<Session[]>;
    findOneWithShotsForActor(sessionId: string, actorId: string, role: UserRole, shooterIdHint?: string): Promise<Session>;
    softDeleteForActor(sessionId: string, actorId: string, role: UserRole, shooterIdHint?: string): Promise<void>;
    private resolveShooterForRead;
    private resolveShooterForWrite;
    private assertActorCanReadShooter;
    private assertActorCanWriteShooter;
    private assertCoachCanAccessShooter;
    private mapSession;
}

import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtPayload, Session } from '@shooting-platform/shared-types';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(user: JwtPayload, shooterId: string | undefined, dto: CreateSessionDto): Promise<Session>;
    findAll(user: JwtPayload, shooterId: string | undefined): Promise<Session[]>;
    findOne(user: JwtPayload, id: string, shooterId: string | undefined): Promise<Session>;
    remove(user: JwtPayload, id: string, shooterId: string | undefined): Promise<void>;
}

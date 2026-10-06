import { PrismaService } from '../prisma/prisma.service';
export declare class SquadsService {
    private prisma;
    constructor(prisma: PrismaService);
    createSquad(coachId: string, data: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        coachId: string;
        description: string | null;
    }>;
    getMySquads(coachId: string): Promise<({
        members: ({
            shooter: {
                name: string;
                id: string;
            };
        } & {
            id: string;
            shooterId: string;
            joinedAt: Date;
            squadId: string;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        coachId: string;
        description: string | null;
    })[]>;
    addMember(squadId: string, shooterId: string): Promise<{
        id: string;
        shooterId: string;
        joinedAt: Date;
        squadId: string;
    }>;
    createGroupSession(coachId: string, squadId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        date: Date;
        notes: string | null;
        squadId: string;
    }>;
}

import { SquadsService } from './squads.service';
export declare class SquadsController {
    private readonly squadsService;
    constructor(squadsService: SquadsService);
    createSquad(req: any, data: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        coachId: string;
        description: string | null;
    }>;
    getMySquads(req: any): Promise<({
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
    addMember(id: string, shooterId: string): Promise<{
        id: string;
        shooterId: string;
        joinedAt: Date;
        squadId: string;
    }>;
    createGroupSession(id: string, req: any, data: any): Promise<{
        id: string;
        createdAt: Date;
        date: Date;
        notes: string | null;
        squadId: string;
    }>;
}

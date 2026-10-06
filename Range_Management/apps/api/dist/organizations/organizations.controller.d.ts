import { OrganizationsService } from './organizations.service';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(req: any, createOrgDto: {
        name: string;
        type: string;
        description?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        type: string;
        logoUrl: string | null;
        adminUserId: string;
    }>;
    findAll(req: any): Promise<({
        ranges: {
            name: string;
            id: string;
            createdAt: Date;
            description: string | null;
            updatedAt: Date;
            code: string;
            rangeStatus: string;
            ownerId: string;
            address: string | null;
            phone: string | null;
            gpsCoordinates: string | null;
            maxLanes: number | null;
            isActive: boolean;
            organizationId: string | null;
        }[];
        members: {
            role: string;
            id: string;
            userId: string;
            organizationId: string;
            joinedAt: Date;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        type: string;
        logoUrl: string | null;
        adminUserId: string;
    })[]>;
    findOne(id: string): Promise<({
        ranges: {
            name: string;
            id: string;
            createdAt: Date;
            description: string | null;
            updatedAt: Date;
            code: string;
            rangeStatus: string;
            ownerId: string;
            address: string | null;
            phone: string | null;
            gpsCoordinates: string | null;
            maxLanes: number | null;
            isActive: boolean;
            organizationId: string | null;
        }[];
        members: {
            role: string;
            id: string;
            userId: string;
            organizationId: string;
            joinedAt: Date;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        type: string;
        logoUrl: string | null;
        adminUserId: string;
    }) | null>;
    update(id: string, updateOrgDto: {
        name?: string;
        description?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        type: string;
        logoUrl: string | null;
        adminUserId: string;
    }>;
    registerRange(req: any, id: string, data: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        code: string;
        rangeStatus: string;
        ownerId: string;
        address: string | null;
        phone: string | null;
        gpsCoordinates: string | null;
        maxLanes: number | null;
        isActive: boolean;
        organizationId: string | null;
    }>;
}

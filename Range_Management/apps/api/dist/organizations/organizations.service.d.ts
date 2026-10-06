import { PrismaService } from '../prisma/prisma.service';
export declare class OrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createOrganization(adminUserId: string, data: {
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
    getOrganizationsByUser(userId: string): Promise<({
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
    getOrganizationById(id: string): Promise<({
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
    updateOrganization(id: string, data: {
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
    registerRange(organizationId: string, ownerId: string, data: any): Promise<{
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

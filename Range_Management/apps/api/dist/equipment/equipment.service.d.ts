import { PrismaService } from '../prisma/prisma.service';
export declare class EquipmentService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): import(".prisma/client").Prisma.PrismaPromise<({
        optic: {
            id: string;
            equipmentId: string;
            magnification: string | null;
            objectiveLens: number | null;
            reticleType: string | null;
            turretClicks: string | null;
        } | null;
        ballisticProfiles: {
            name: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            equipmentId: string | null;
            muzzleVelocityFps: number;
            pelletWeightGrains: number;
            ballisticCoef: number;
            sightHeightInches: number;
            zeroRangeYards: number;
        }[];
        serviceLogs: {
            id: string;
            description: string;
            date: Date;
            equipmentId: string;
            partsReplaced: string | null;
            roundsCount: number | null;
            cost: number | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: string;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        model: string | null;
        make: string | null;
        serialNumber: string | null;
        caliber: string | null;
        roundCount: number;
        barrelLifePct: number | null;
        purchaseDate: Date | null;
        purchasePrice: number | null;
        barrelLengthMm: number | null;
        actionType: string | null;
        isLoanerWeapon: boolean;
        loanedToUserId: string | null;
    })[]>;
    create(userId: string, dto: any): import(".prisma/client").Prisma.Prisma__EquipmentClient<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: string;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        model: string | null;
        make: string | null;
        serialNumber: string | null;
        caliber: string | null;
        roundCount: number;
        barrelLifePct: number | null;
        purchaseDate: Date | null;
        purchasePrice: number | null;
        barrelLengthMm: number | null;
        actionType: string | null;
        isLoanerWeapon: boolean;
        loanedToUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, userId: string, dto: any): import(".prisma/client").Prisma.Prisma__EquipmentClient<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: string;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        model: string | null;
        make: string | null;
        serialNumber: string | null;
        caliber: string | null;
        roundCount: number;
        barrelLifePct: number | null;
        purchaseDate: Date | null;
        purchasePrice: number | null;
        barrelLengthMm: number | null;
        actionType: string | null;
        isLoanerWeapon: boolean;
        loanedToUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string, userId: string): import(".prisma/client").Prisma.Prisma__EquipmentClient<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: string;
        type: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        model: string | null;
        make: string | null;
        serialNumber: string | null;
        caliber: string | null;
        roundCount: number;
        barrelLifePct: number | null;
        purchaseDate: Date | null;
        purchasePrice: number | null;
        barrelLengthMm: number | null;
        actionType: string | null;
        isLoanerWeapon: boolean;
        loanedToUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    addServiceLog(equipmentId: string, data: any): Promise<{
        id: string;
        description: string;
        date: Date;
        equipmentId: string;
        partsReplaced: string | null;
        roundsCount: number | null;
        cost: number | null;
    }>;
    addAmmoLot(userId: string, data: any): Promise<{
        inventory: {
            id: string;
            totalRounds: number;
            lastUpdated: Date;
            ammoLotId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        caliber: string;
        brand: string;
        bulletWeightGrains: number;
        lotNumber: string | null;
        quantity: number;
    }>;
    getAmmoLots(userId: string): Promise<({
        inventory: {
            id: string;
            totalRounds: number;
            lastUpdated: Date;
            ammoLotId: string;
        } | null;
        reloadingLogs: {
            id: string;
            date: Date;
            ammoLotId: string;
            powderType: string | null;
            powderCharge: number | null;
            primerType: string | null;
            overallLength: number | null;
            roundsProduced: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        caliber: string;
        brand: string;
        bulletWeightGrains: number;
        lotNumber: string | null;
        quantity: number;
    })[]>;
    addReloadingLog(ammoLotId: string, data: any): Promise<{
        id: string;
        date: Date;
        ammoLotId: string;
        powderType: string | null;
        powderCharge: number | null;
        primerType: string | null;
        overallLength: number | null;
        roundsProduced: number;
    }>;
    createBallisticProfile(equipmentId: string, data: any): Promise<{
        name: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        equipmentId: string | null;
        muzzleVelocityFps: number;
        pelletWeightGrains: number;
        ballisticCoef: number;
        sightHeightInches: number;
        zeroRangeYards: number;
    }>;
}

import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
export declare class EquipmentController {
    private readonly equipmentService;
    constructor(equipmentService: EquipmentService);
    findAll(req: any): import(".prisma/client").Prisma.PrismaPromise<({
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
    create(req: any, dto: CreateEquipmentDto): import(".prisma/client").Prisma.Prisma__EquipmentClient<{
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
    update(id: string, req: any, dto: UpdateEquipmentDto): import(".prisma/client").Prisma.Prisma__EquipmentClient<{
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
    remove(id: string, req: any): import(".prisma/client").Prisma.Prisma__EquipmentClient<{
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
    addServiceLog(id: string, data: any): Promise<{
        id: string;
        description: string;
        date: Date;
        equipmentId: string;
        partsReplaced: string | null;
        roundsCount: number | null;
        cost: number | null;
    }>;
    getAmmoLots(req: any): Promise<({
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
    addAmmoLot(req: any, data: any): Promise<{
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
    addReloadingLog(id: string, data: any): Promise<{
        id: string;
        date: Date;
        ammoLotId: string;
        powderType: string | null;
        powderCharge: number | null;
        primerType: string | null;
        overallLength: number | null;
        roundsProduced: number;
    }>;
    addBallisticProfile(id: string, data: any): Promise<{
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

export declare enum EquipmentType {
    RIFLE = "RIFLE",
    PISTOL = "PISTOL",
    SHOTGUN = "SHOTGUN",
    CROSSBOW = "CROSSBOW",
    OTHER = "OTHER"
}
export declare class CreateEquipmentDto {
    name: string;
    type: EquipmentType;
    serialNumber?: string;
    caliber?: string;
    purchaseDate?: string;
    notes?: string;
}

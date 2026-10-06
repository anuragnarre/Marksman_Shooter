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
exports.CreateEquipmentDto = exports.EquipmentType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var EquipmentType;
(function (EquipmentType) {
    EquipmentType["RIFLE"] = "RIFLE";
    EquipmentType["PISTOL"] = "PISTOL";
    EquipmentType["SHOTGUN"] = "SHOTGUN";
    EquipmentType["CROSSBOW"] = "CROSSBOW";
    EquipmentType["OTHER"] = "OTHER";
})(EquipmentType || (exports.EquipmentType = EquipmentType = {}));
class CreateEquipmentDto {
}
exports.CreateEquipmentDto = CreateEquipmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Glock 19 Gen 5', description: 'Name of the equipment' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateEquipmentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: EquipmentType, example: EquipmentType.PISTOL }),
    (0, class_validator_1.IsEnum)(EquipmentType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEquipmentDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'BXYZ123', description: 'Serial number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateEquipmentDto.prototype, "serialNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '9mm', description: 'Caliber or gauge' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateEquipmentDto.prototype, "caliber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2023-01-15T00:00:00.000Z', description: 'Purchase date' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEquipmentDto.prototype, "purchaseDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Used for IPSC matches', description: 'Additional notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateEquipmentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-equipment.dto.js.map
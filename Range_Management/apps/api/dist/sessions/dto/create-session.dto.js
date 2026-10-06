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
exports.CreateSessionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateSessionDto {
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Target Shooting', description: 'Discipline name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "discipline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50, description: 'Distance in yards or meters' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "distance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Air Rifle', description: 'Type of weapon used' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "weaponType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 60, description: 'Number of shots fired' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "numberOfShots", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-10-01T10:00:00Z', description: 'Date of the session' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "sessionDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Prone', description: 'Training mode/position' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "trainingMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-range-id', description: 'Range ID for weather enrichment' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "rangeId", void 0);
//# sourceMappingURL=create-session.dto.js.map
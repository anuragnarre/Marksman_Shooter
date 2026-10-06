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
exports.CreateBallisticsDto = exports.AtmosphericConditionsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class AtmosphericConditionsDto {
}
exports.AtmosphericConditionsDto = AtmosphericConditionsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 70, description: 'Temperature in Fahrenheit' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AtmosphericConditionsDto.prototype, "temp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50, description: 'Humidity percentage' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AtmosphericConditionsDto.prototype, "humidity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1000, description: 'Altitude in feet' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AtmosphericConditionsDto.prototype, "altitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, description: 'Wind speed in mph' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AtmosphericConditionsDto.prototype, "windSpeedMph", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 90, description: 'Wind angle in degrees' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AtmosphericConditionsDto.prototype, "windAngleDeg", void 0);
class CreateBallisticsDto {
}
exports.CreateBallisticsDto = CreateBallisticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rifle', description: 'Type of the weapon' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBallisticsDto.prototype, "weaponType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '.308 Win', description: 'Caliber of the weapon' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBallisticsDto.prototype, "caliber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 168, description: 'Weight of the bullet in grains' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreateBallisticsDto.prototype, "bulletWeightGrains", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2600, description: 'Muzzle velocity in fps' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.Max)(5000),
    __metadata("design:type", Number)
], CreateBallisticsDto.prototype, "muzzleVelocityFps", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.45, description: 'Ballistic coefficient' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBallisticsDto.prototype, "ballisticCoefficient", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100, description: 'Zero distance in yards' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateBallisticsDto.prototype, "zeroDistanceYards", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => AtmosphericConditionsDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AtmosphericConditionsDto),
    __metadata("design:type", AtmosphericConditionsDto)
], CreateBallisticsDto.prototype, "atmosphericConditions", void 0);
//# sourceMappingURL=create-ballistics.dto.js.map
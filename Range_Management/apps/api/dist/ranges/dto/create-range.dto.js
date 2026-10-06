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
exports.CreateRangeDto = exports.RangeStatus = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var RangeStatus;
(function (RangeStatus) {
    RangeStatus["Active"] = "Active";
    RangeStatus["Inactive"] = "Inactive";
    RangeStatus["Maintenance"] = "Maintenance";
})(RangeStatus || (exports.RangeStatus = RangeStatus = {}));
class CreateRangeDto {
}
exports.CreateRangeDto = CreateRangeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Main Shooting Range', description: 'Name of the range' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateRangeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: RangeStatus, example: RangeStatus.Active }),
    (0, class_validator_1.IsEnum)(RangeStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRangeDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1000, description: 'Maximum distance in yards/meters' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(2000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateRangeDto.prototype, "maxDistance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 350, description: 'Altitude in meters above sea level' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateRangeDto.prototype, "altitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '34.0522,-118.2437', description: 'Latitude and Longitude' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/, {
        message: 'gpsCoordinates must be a valid lat,lng string',
    }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateRangeDto.prototype, "gpsCoordinates", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'NW', description: 'Typical wind direction' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateRangeDto.prototype, "typicalWindDir", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '.338 Lapua', description: 'Maximum allowed caliber' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], CreateRangeDto.prototype, "maxCaliber", void 0);
//# sourceMappingURL=create-range.dto.js.map
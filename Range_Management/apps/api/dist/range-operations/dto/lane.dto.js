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
exports.UpdateLaneStatusDto = exports.CreateLaneDto = exports.LaneStatus = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var LaneStatus;
(function (LaneStatus) {
    LaneStatus["AVAILABLE"] = "AVAILABLE";
    LaneStatus["OCCUPIED"] = "OCCUPIED";
    LaneStatus["MAINTENANCE"] = "MAINTENANCE";
})(LaneStatus || (exports.LaneStatus = LaneStatus = {}));
class CreateLaneDto {
}
exports.CreateLaneDto = CreateLaneDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateLaneDto.prototype, "laneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateLaneDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(LaneStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLaneDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateLaneDto.prototype, "maxCaliber", void 0);
class UpdateLaneStatusDto {
}
exports.UpdateLaneStatusDto = UpdateLaneStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(LaneStatus),
    __metadata("design:type", String)
], UpdateLaneStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLaneStatusDto.prototype, "shooterId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateLaneStatusDto.prototype, "sessionType", void 0);
//# sourceMappingURL=lane.dto.js.map
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
exports.WalkInCheckInDto = exports.CheckInBookingDto = exports.CancelBookingDto = exports.CreateBookingDto = exports.CreateTimeSlotDto = exports.SetOperatingHoursDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SetOperatingHoursDto {
}
exports.SetOperatingHoursDto = SetOperatingHoursDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '0=Sunday … 6=Saturday' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], SetOperatingHoursDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], SetOperatingHoursDto.prototype, "openTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '21:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], SetOperatingHoursDto.prototype, "closeTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 60 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(480),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SetOperatingHoursDto.prototype, "slotDurationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SetOperatingHoursDto.prototype, "isOpen", void 0);
class CreateTimeSlotDto {
}
exports.CreateTimeSlotDto = CreateTimeSlotDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimeSlotDto.prototype, "laneId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-25T09:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimeSlotDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-09-25T10:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimeSlotDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTimeSlotDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['WALK_IN', 'RESERVATION_ONLY'] }),
    (0, class_validator_1.IsEnum)(['WALK_IN', 'RESERVATION_ONLY']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTimeSlotDto.prototype, "slotType", void 0);
class CreateBookingDto {
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "slotId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "laneId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "rangeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateBookingDto.prototype, "numberOfShooters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['NONE', 'WEEKLY', 'BIWEEKLY'] }),
    (0, class_validator_1.IsEnum)(['NONE', 'WEEKLY', 'BIWEEKLY']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "recurringType", void 0);
class CancelBookingDto {
}
exports.CancelBookingDto = CancelBookingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(300),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], CancelBookingDto.prototype, "reason", void 0);
class CheckInBookingDto {
}
exports.CheckInBookingDto = CheckInBookingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CheckInBookingDto.prototype, "laneId", void 0);
class WalkInCheckInDto {
}
exports.WalkInCheckInDto = WalkInCheckInDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WalkInCheckInDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], WalkInCheckInDto.prototype, "numberOfShooters", void 0);
//# sourceMappingURL=booking.dto.js.map
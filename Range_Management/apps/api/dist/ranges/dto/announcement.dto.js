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
exports.CreateAnnouncementDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateAnnouncementDto {
}
exports.CreateAnnouncementDto = CreateAnnouncementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Range Closed Sunday 29th' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(150),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'The range will be closed for maintenance on Sunday 29th September.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['GENERAL', 'CLOSURE', 'MAINTENANCE', 'SPECIAL_EVENT'] }),
    (0, class_validator_1.IsEnum)(['GENERAL', 'CLOSURE', 'MAINTENANCE', 'SPECIAL_EVENT']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-29T00:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "startsAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-29T23:59:59.000Z' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "endsAt", void 0);
//# sourceMappingURL=announcement.dto.js.map
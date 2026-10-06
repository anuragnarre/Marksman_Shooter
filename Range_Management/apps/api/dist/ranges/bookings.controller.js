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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const booking_service_1 = require("../ranges/booking.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const booking_dto_1 = require("../ranges/dto/booking.dto");
let BookingsController = class BookingsController {
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    createBooking(user, dto) {
        return this.bookingService.createBooking(user.sub, dto);
    }
    getMyBookings(user) {
        return this.bookingService.getMyBookings(user.sub);
    }
    cancelBooking(id, user, dto) {
        return this.bookingService.cancelBooking(id, user.sub, dto);
    }
    checkIn(id, dto) {
        return this.bookingService.checkInBooking(id, dto);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '2.2.4 Create a booking for a time slot' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: '2.2.4 Get my bookings' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getMyBookings", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: '2.2.4 Cancel a booking (notifies waitlist)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, booking_dto_1.CancelBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Post)(':id/check-in'),
    (0, roles_decorator_1.Roles)('RANGE_OPERATOR', 'RANGE_ADMIN', 'RSO', 'STAFF'),
    (0, swagger_1.ApiOperation)({ summary: '2.2.4 Check in a shooter at the gate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.CheckInBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "checkIn", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map
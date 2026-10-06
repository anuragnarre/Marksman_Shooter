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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
let BillingController = class BillingController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async checkout(userId, amount, currency, method) {
        return this.paymentsService.createPayment(userId, amount, currency, method);
    }
    async getDashboard(rangeId) {
        return this.paymentsService.getFinancialDashboard(rangeId);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)('userId')),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, common_1.Body)('currency')),
    __param(3, (0, common_1.Body)('method')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Query)('rangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getDashboard", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map
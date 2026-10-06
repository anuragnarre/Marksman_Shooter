"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_requests_controller_1 = require("./schedule-requests.controller");
const schedule_requests_service_1 = require("./schedule-requests.service");
const auth_module_1 = require("../auth/auth.module");
const gateway_module_1 = require("../gateway/gateway.module");
let ScheduleRequestsModule = class ScheduleRequestsModule {
};
exports.ScheduleRequestsModule = ScheduleRequestsModule;
exports.ScheduleRequestsModule = ScheduleRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, gateway_module_1.GatewayModule],
        controllers: [schedule_requests_controller_1.ScheduleRequestsController],
        providers: [schedule_requests_service_1.ScheduleRequestsService],
    })
], ScheduleRequestsModule);
//# sourceMappingURL=schedule-requests.module.js.map
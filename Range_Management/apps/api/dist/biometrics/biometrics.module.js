"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiometricsModule = void 0;
const common_1 = require("@nestjs/common");
const biometrics_controller_1 = require("./biometrics.controller");
const biometrics_service_1 = require("./biometrics.service");
const biometrics_ai_service_1 = require("./biometrics-ai.service");
const device_auth_guard_1 = require("./guards/device-auth.guard");
const prisma_module_1 = require("../prisma/prisma.module");
const gateway_module_1 = require("../gateway/gateway.module");
const analytics_module_1 = require("../analytics/analytics.module");
const auth_module_1 = require("../auth/auth.module");
let BiometricsModule = class BiometricsModule {
};
exports.BiometricsModule = BiometricsModule;
exports.BiometricsModule = BiometricsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, gateway_module_1.GatewayModule, analytics_module_1.AnalyticsModule, auth_module_1.AuthModule],
        controllers: [biometrics_controller_1.BiometricsController],
        providers: [biometrics_service_1.BiometricsService, biometrics_ai_service_1.BiometricsAiService, device_auth_guard_1.DeviceAuthGuard],
        exports: [biometrics_service_1.BiometricsService],
    })
], BiometricsModule);
//# sourceMappingURL=biometrics.module.js.map
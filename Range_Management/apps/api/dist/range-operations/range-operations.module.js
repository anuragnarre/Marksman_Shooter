"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeOperationsModule = void 0;
const common_1 = require("@nestjs/common");
const range_operations_service_1 = require("./range-operations.service");
const prisma_module_1 = require("../prisma/prisma.module");
const telemetry_gateway_1 = require("./telemetry/telemetry.gateway");
const range_operations_controller_1 = require("./range-operations.controller");
let RangeOperationsModule = class RangeOperationsModule {
};
exports.RangeOperationsModule = RangeOperationsModule;
exports.RangeOperationsModule = RangeOperationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [range_operations_service_1.RangeOperationsService, telemetry_gateway_1.TelemetryGateway],
        exports: [range_operations_service_1.RangeOperationsService],
        controllers: [range_operations_controller_1.RangeOperationsController]
    })
], RangeOperationsModule);
//# sourceMappingURL=range-operations.module.js.map
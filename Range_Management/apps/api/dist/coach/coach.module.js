"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachModule = void 0;
const common_1 = require("@nestjs/common");
const coach_service_1 = require("./coach.service");
const coach_controller_1 = require("./coach.controller");
const squads_service_1 = require("./squads.service");
const squads_controller_1 = require("./squads.controller");
const drills_service_1 = require("./drills.service");
const drills_controller_1 = require("./drills.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const gateway_module_1 = require("../gateway/gateway.module");
let CoachModule = class CoachModule {
};
exports.CoachModule = CoachModule;
exports.CoachModule = CoachModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, gateway_module_1.GatewayModule],
        controllers: [coach_controller_1.CoachController, squads_controller_1.SquadsController, drills_controller_1.DrillsController],
        providers: [coach_service_1.CoachService, squads_service_1.SquadsService, drills_service_1.DrillsService],
        exports: [coach_service_1.CoachService, squads_service_1.SquadsService, drills_service_1.DrillsService],
    })
], CoachModule);
//# sourceMappingURL=coach.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShotsModule = void 0;
const common_1 = require("@nestjs/common");
const shots_controller_1 = require("./shots.controller");
const shots_service_1 = require("./shots.service");
const vision_service_1 = require("./vision.service");
const auth_module_1 = require("../auth/auth.module");
const gateway_module_1 = require("../gateway/gateway.module");
let ShotsModule = class ShotsModule {
};
exports.ShotsModule = ShotsModule;
exports.ShotsModule = ShotsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, gateway_module_1.GatewayModule],
        controllers: [shots_controller_1.ShotsController],
        providers: [shots_service_1.ShotsService, vision_service_1.VisionService],
        exports: [shots_service_1.ShotsService],
    })
], ShotsModule);
//# sourceMappingURL=shots.module.js.map
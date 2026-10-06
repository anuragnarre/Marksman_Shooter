"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesDashboardModule = void 0;
const common_1 = require("@nestjs/common");
const notifications_module_1 = require("../notifications/notifications.module");
const range_admin_controller_1 = require("./range-admin.controller");
const rso_controller_1 = require("./rso.controller");
const staff_controller_1 = require("./staff.controller");
const parent_guardian_controller_1 = require("./parent-guardian.controller");
let RolesDashboardModule = class RolesDashboardModule {
};
exports.RolesDashboardModule = RolesDashboardModule;
exports.RolesDashboardModule = RolesDashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [range_admin_controller_1.RangeAdminController, rso_controller_1.RsoController, staff_controller_1.StaffController, parent_guardian_controller_1.ParentGuardianController],
    })
], RolesDashboardModule);
//# sourceMappingURL=roles-dashboard.module.js.map
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
exports.SuggestionsService = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("../analytics/analytics.service");
const rules_engine_1 = require("./rules.engine");
let SuggestionsService = class SuggestionsService {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
        this.rulesEngine = new rules_engine_1.RulesEngine();
    }
    async getSuggestionsForUser(sessionId, requesterId, requesterRole) {
        const analytics = await this.analyticsService.computeForSessionForActor(requesterId, requesterRole, sessionId);
        const suggestions = this.rulesEngine.evaluate(analytics);
        return { sessionId, suggestions };
    }
};
exports.SuggestionsService = SuggestionsService;
exports.SuggestionsService = SuggestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], SuggestionsService);
//# sourceMappingURL=suggestions.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const telemetry_gateway_1 = require("./telemetry.gateway");
describe('TelemetryGateway', () => {
    let gateway;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [telemetry_gateway_1.TelemetryGateway],
        }).compile();
        gateway = module.get(telemetry_gateway_1.TelemetryGateway);
    });
    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
//# sourceMappingURL=telemetry.gateway.spec.js.map
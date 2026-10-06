"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const range_operations_service_1 = require("./range-operations.service");
describe('RangeOperationsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [range_operations_service_1.RangeOperationsService],
        }).compile();
        service = module.get(range_operations_service_1.RangeOperationsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=range-operations.service.spec.js.map
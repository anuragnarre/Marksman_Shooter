"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const range_operations_controller_1 = require("./range-operations.controller");
describe('RangeOperationsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [range_operations_controller_1.RangeOperationsController],
        }).compile();
        controller = module.get(range_operations_controller_1.RangeOperationsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=range-operations.controller.spec.js.map
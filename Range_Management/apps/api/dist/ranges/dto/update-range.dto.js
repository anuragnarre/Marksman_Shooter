"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRangeDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_range_dto_1 = require("./create-range.dto");
class UpdateRangeDto extends (0, mapped_types_1.PartialType)(create_range_dto_1.CreateRangeDto) {
}
exports.UpdateRangeDto = UpdateRangeDto;
//# sourceMappingURL=update-range.dto.js.map
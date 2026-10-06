"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBallisticsDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_ballistics_dto_1 = require("./create-ballistics.dto");
class UpdateBallisticsDto extends (0, mapped_types_1.PartialType)(create_ballistics_dto_1.CreateBallisticsDto) {
}
exports.UpdateBallisticsDto = UpdateBallisticsDto;
//# sourceMappingURL=update-ballistics.dto.js.map
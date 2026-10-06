"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEquipmentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_equipment_dto_1 = require("./create-equipment.dto");
class UpdateEquipmentDto extends (0, mapped_types_1.PartialType)(create_equipment_dto_1.CreateEquipmentDto) {
}
exports.UpdateEquipmentDto = UpdateEquipmentDto;
//# sourceMappingURL=update-equipment.dto.js.map
import { PartialType } from '@nestjs/mapped-types';
import { CreateRangeDto } from './create-range.dto';

export class UpdateRangeDto extends PartialType(CreateRangeDto) {}

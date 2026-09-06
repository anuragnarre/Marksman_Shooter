import { PartialType } from '@nestjs/mapped-types';
import { CreateBallisticsDto } from './create-ballistics.dto';

export class UpdateBallisticsDto extends PartialType(CreateBallisticsDto) {}

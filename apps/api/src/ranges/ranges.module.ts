import { Module } from '@nestjs/common';
import { RangesController } from './ranges.controller';
import { RangesService } from './ranges.service';

@Module({
  controllers: [RangesController],
  providers: [RangesService],
})
export class RangesModule {}

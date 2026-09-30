import { Module } from '@nestjs/common';
import { RangesService } from './ranges.service';
import { RangesController } from './ranges.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RangesController],
  providers: [RangesService],
  exports: [RangesService],
})
export class RangesModule {}

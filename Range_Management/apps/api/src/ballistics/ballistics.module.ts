import { Module } from '@nestjs/common';
import { BallisticsController } from './ballistics.controller';
import { BallisticsService } from './ballistics.service';

@Module({
  controllers: [BallisticsController],
  providers: [BallisticsService],
})
export class BallisticsModule {}

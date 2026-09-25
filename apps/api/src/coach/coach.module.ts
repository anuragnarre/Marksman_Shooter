// apps/api/src/coach/coach.module.ts
import { Module } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachController } from './coach.controller';
import { SquadsService } from './squads.service';
import { SquadsController } from './squads.controller';
import { DrillsService } from './drills.service';
import { DrillsController } from './drills.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [CoachController, SquadsController, DrillsController],
  providers: [CoachService, SquadsService, DrillsService],
  exports: [CoachService, SquadsService, DrillsService],
})
export class CoachModule {}

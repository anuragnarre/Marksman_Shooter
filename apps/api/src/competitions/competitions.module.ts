import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompetitionsController } from './competitions.controller';
import { CompetitionsService } from './competitions.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService]
})
export class CompetitionsModule {}

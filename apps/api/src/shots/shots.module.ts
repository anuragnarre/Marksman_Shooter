// apps/api/src/shots/shots.module.ts
import { Module } from '@nestjs/common';
import { ShotsController } from './shots.controller';
import { ShotsService } from './shots.service';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [AuthModule, GatewayModule],
  controllers: [ShotsController],
  providers: [ShotsService],
  exports: [ShotsService],
})
export class ShotsModule {}

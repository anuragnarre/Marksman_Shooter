// apps/api/src/sessions/sessions.module.ts
import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthModule } from '../auth/auth.module';
import { RangesModule } from '../ranges/ranges.module';

@Module({
  imports: [AuthModule, RangesModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

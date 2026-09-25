import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RangeAdminController } from './range-admin.controller';
import { RsoController } from './rso.controller';
import { StaffController } from './staff.controller';
import { ParentGuardianController } from './parent-guardian.controller';

@Module({
  controllers: [RangeAdminController, RsoController, StaffController, ParentGuardianController],
})
export class RolesDashboardModule {}

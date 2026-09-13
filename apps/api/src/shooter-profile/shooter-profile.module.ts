import { Module } from '@nestjs/common';
import { ShooterProfileController } from './shooter-profile.controller';
import { ShooterProfileService } from './shooter-profile.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShooterProfileController],
  providers: [ShooterProfileService],
  exports: [ShooterProfileService],
})
export class ShooterProfileModule {}

import { Module } from '@nestjs/common';
import { DaysService } from './days.service';
import { DaysController } from './days.controller';
import { DaysRepository } from './days.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [PrismaModule, ActivitiesModule],
  controllers: [DaysController],
  providers: [DaysService, DaysRepository],
  exports: [DaysService]
})
export class DaysModule {}

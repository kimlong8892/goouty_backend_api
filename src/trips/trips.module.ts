import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripsRepository } from './trips.repository';
import { PrismaModule } from '../prisma/prisma.module';
import {DaysService} from "../days/days.service";
import {DaysRepository} from "../days/days.repository";
import { EmailModule } from '../email/email.module';
import { NotificationModule } from '../notifications/notification.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, EmailModule, NotificationModule, UploadModule],
  controllers: [TripsController],
  providers: [TripsService, TripsRepository, DaysService, DaysRepository],
  exports: [TripsService, TripsRepository, DaysService, DaysRepository]
})
export class TripsModule {}

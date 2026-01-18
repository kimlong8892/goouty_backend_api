import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesRepository } from './activities.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    UploadModule
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivitiesRepository],
  exports: [ActivitiesService, ActivitiesRepository]
})
export class ActivitiesModule { }
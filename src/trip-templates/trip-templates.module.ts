import { Module } from '@nestjs/common';
import { TripTemplatesService } from './trip-templates.service';
import { TripTemplatesController } from './trip-templates.controller';
import { TripTemplatesRepository } from './trip-templates.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TripTemplatesController],
  providers: [TripTemplatesService, TripTemplatesRepository],
  exports: [TripTemplatesService, TripTemplatesRepository],
})
export class TripTemplatesModule {}

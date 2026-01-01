import { Module } from '@nestjs/common';
import { ProvincesController } from './provinces.controller';
import { ProvincesService } from './provinces.service';
import { ProvincesRepository } from './provinces.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProvincesController],
  providers: [ProvincesService, ProvincesRepository],
  exports: [ProvincesService, ProvincesRepository],
})
export class ProvincesModule {}

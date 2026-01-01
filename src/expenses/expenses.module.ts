import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ExpenseCalculationService } from './expense-calculation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseCalculationService],
  exports: [ExpensesService, ExpenseCalculationService],
})
export class ExpensesModule {}

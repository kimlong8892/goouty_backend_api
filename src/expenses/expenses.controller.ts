import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseResponseDto, ExpenseListResponseDto } from './dto/expense-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ExpenseCalculationResponseDto
} from './dto/expense-calculation.dto';
import {
  UpdatePaymentSettlementDto,
  PaymentSettlementResponseDto
} from './dto/payment-settlement.dto';
import {
  CreatePaymentTransactionDto,
  PaymentTransactionResponseDto
} from './dto/payment-transaction.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Request() req): Promise<ExpenseResponseDto> {
    return this.expensesService.create(createExpenseDto, req.user.userId);
  }

  @Get('trip/:tripId')
  findAllByTrip(
    @Param('tripId') tripId: string,
    @Request() req
  ): Promise<ExpenseListResponseDto[]> {
    return this.expensesService.findAllByTrip(tripId, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(id, updateExpenseDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.expensesService.remove(id, req.user.userId);
  }

  // Expense calculation endpoints
  @Get('trip/:tripId/calculation')
  calculateTripExpenses(
    @Param('tripId') tripId: string,
    @Request() req
  ): Promise<ExpenseCalculationResponseDto> {
    return this.expensesService.calculateTripExpenses(tripId, req.user.userId);
  }

  @Post('trip/:tripId/settlements')
  createPaymentSettlements(
    @Param('tripId') tripId: string,
    @Request() req
  ): Promise<void> {
    return this.expensesService.createPaymentSettlements(tripId, req.user.userId);
  }

  @Get('trip/:tripId/settlements')
  getPaymentSettlements(
    @Param('tripId') tripId: string,
    @Request() req
  ): Promise<PaymentSettlementResponseDto[]> {
    return this.expensesService.getPaymentSettlements(tripId, req.user.userId);
  }

  @Patch('settlements/:settlementId')
  updatePaymentSettlement(
    @Param('settlementId') settlementId: string,
    @Body() updateDto: UpdatePaymentSettlementDto,
    @Request() req
  ): Promise<PaymentSettlementResponseDto> {
    return this.expensesService.updatePaymentSettlement(settlementId, updateDto, req.user.userId);
  }

  @Get('settlements/:settlementId/transactions')
  getPaymentTransactions(
    @Param('settlementId') settlementId: string,
    @Request() req
  ): Promise<PaymentTransactionResponseDto[]> {
    return this.expensesService.getPaymentTransactions(settlementId, req.user.userId);
  }

  @Post('settlements/:settlementId/transactions')
  createPaymentTransaction(
    @Param('settlementId') settlementId: string,
    @Body() dto: CreatePaymentTransactionDto,
    @Request() req
  ): Promise<PaymentTransactionResponseDto> {
    return this.expensesService.createPaymentTransaction(settlementId, dto, req.user.userId);
  }
}

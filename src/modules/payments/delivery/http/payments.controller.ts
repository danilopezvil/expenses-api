import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';
import { GetPaymentsQuery } from '../../application/queries/get-payments.query';
import { CreatePaymentUseCase } from '../../application/use-cases/create-payment.use-case';
import { DeletePaymentUseCase } from '../../application/use-cases/delete-payment.use-case';
import { CreatePaymentHttpDto } from './dtos/payments-http.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GroupMemberGuard)
@Controller({ path: 'groups/:groupId/payments', version: '1' })
export class PaymentsController {
  constructor(
    private readonly getPayments: GetPaymentsQuery,
    private readonly createPayment: CreatePaymentUseCase,
    private readonly deletePayment: DeletePaymentUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List payments for a group' })
  @ApiOkResponse()
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  async findAll(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.getPayments.execute(groupId, { month, year });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a payment' })
  @ApiCreatedResponse()
  async create(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreatePaymentHttpDto,
  ) {
    const result = await this.createPayment.execute({ ...dto, groupId });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Delete(':paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiNoContentResponse()
  async remove(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<void> {
    const result = await this.deletePayment.execute(paymentId, groupId);
    if (result.isErr()) throw result.error;
  }
}

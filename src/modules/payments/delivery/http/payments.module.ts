import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { GetPaymentsQuery } from '../../application/queries/get-payments.query';
import { CreatePaymentUseCase } from '../../application/use-cases/create-payment.use-case';
import { DeletePaymentUseCase } from '../../application/use-cases/delete-payment.use-case';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';

@Module({
  controllers: [PaymentsController],
  providers: [
    GetPaymentsQuery,
    CreatePaymentUseCase,
    DeletePaymentUseCase,
    GroupMemberGuard,
  ],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { CreateExpenseUseCase } from '../../application/use-cases/create-expense.use-case';
import { GetExpenseUseCase } from '../../application/use-cases/get-expense.use-case';
import { UpdateExpenseUseCase } from '../../application/use-cases/update-expense.use-case';
import { DeleteExpenseUseCase } from '../../application/use-cases/delete-expense.use-case';
import { ListExpensesQuery } from '../../application/queries/list-expenses.query';
import { ExpensePrismaRepository } from '../../infrastructure/persistence/expense-prisma.repository';
import { ExpenseDomainService } from '../../domain/services/expense-domain.service';
import { EXPENSE_REPOSITORY } from '../../domain/ports/expense-repository.port';

@Module({
  controllers: [ExpensesController],
  providers: [
    // Domain
    ExpenseDomainService,

    // Use Cases
    CreateExpenseUseCase,
    GetExpenseUseCase,
    UpdateExpenseUseCase,
    DeleteExpenseUseCase,

    // Queries
    ListExpensesQuery,

    // Port → Adapter binding
    {
      provide: EXPENSE_REPOSITORY,
      useClass: ExpensePrismaRepository,
    },
  ],
})
export class ExpensesModule {}

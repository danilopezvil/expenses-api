import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ExpensesController } from './expenses.controller';

// Use cases
import { CreateExpenseUseCase } from '../../application/use-cases/create-expense.use-case';
import { AssignExpenseUseCase } from '../../application/use-cases/assign-expense.use-case';
import { GroupExpensesUseCase } from '../../application/use-cases/group-expenses.use-case';
import { PreviewImportUseCase } from '../../application/use-cases/preview-import.use-case';
import { ConfirmImportUseCase } from '../../application/use-cases/confirm-import.use-case';

// Queries
import { GetExpensesQuery } from '../../application/queries/get-expenses.query';
import { GetDashboardQuery } from '../../application/queries/get-dashboard.query';
import { GetReconciliationQuery } from '../../application/queries/get-reconciliation.query';

// Domain services
import { TextImportParserService } from '../../domain/services/text-import-parser.service';
import { ExpenseGrouperService } from '../../domain/services/expense-grouper.service';

// Injection tokens
import {
  EXPENSE_REPOSITORY_PORT,
  ACCOUNT_REPOSITORY_PORT,
  IMPORTS_REPOSITORY_PORT,
} from '../../domain/ports/injection-tokens';

// Repository adapters
import { ExpensePrismaRepository } from '../../infrastructure/persistence/expense-prisma.repository';
import { AccountPrismaRepository } from '../../infrastructure/persistence/account-prisma.repository';
import { ImportsPrismaRepository } from '../../infrastructure/persistence/imports-prisma.repository';

@Module({
  imports: [CqrsModule],
  controllers: [ExpensesController],
  providers: [
    // Domain services
    TextImportParserService,
    ExpenseGrouperService,

    // Use cases
    CreateExpenseUseCase,
    AssignExpenseUseCase,
    GroupExpensesUseCase,
    PreviewImportUseCase,
    ConfirmImportUseCase,

    // Queries (CQRS read models)
    GetExpensesQuery,
    GetDashboardQuery,
    GetReconciliationQuery,

    // Port → Adapter bindings
    { provide: EXPENSE_REPOSITORY_PORT, useClass: ExpensePrismaRepository },
    { provide: ACCOUNT_REPOSITORY_PORT, useClass: AccountPrismaRepository },
    { provide: IMPORTS_REPOSITORY_PORT, useClass: ImportsPrismaRepository },
  ],
})
export class ExpensesModule {}

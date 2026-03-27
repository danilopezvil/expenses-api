import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ExpensesController } from './expenses.controller';

// Use cases
import { CreateExpenseUseCase } from '../../application/use-cases/create-expense.use-case';
import { AssignExpenseUseCase } from '../../application/use-cases/assign-expense.use-case';
import { GroupExpensesUseCase } from '../../application/use-cases/group-expenses.use-case';
import { PreviewImportUseCase } from '../../application/use-cases/preview-import.use-case';
import { ConfirmImportUseCase } from '../../application/use-cases/confirm-import.use-case';
import { UpdateExpenseUseCase } from '../../application/use-cases/update-expense.use-case';
import { DeleteExpenseUseCase } from '../../application/use-cases/delete-expense.use-case';

// Queries (CQRS read models — use PrismaService directly)
import { GetExpensesQuery } from '../../application/queries/get-expenses.query';
import { GetExpenseQuery } from '../../application/queries/get-expense.query';

// Domain services
import { TextImportParserService } from '../../domain/services/text-import-parser.service';
import { ExpenseGrouperService } from '../../domain/services/expense-grouper.service';

// Event handlers
import { ExpenseAssignedHandler } from '../../application/event-handlers/expense-assigned.handler';
import { ExpenseImportedHandler } from '../../application/event-handlers/expense-imported.handler';

// Injection tokens
import {
  EXPENSE_REPOSITORY_PORT,
  ACCOUNT_REPOSITORY_PORT,
  IMPORTS_REPOSITORY_PORT,
} from '../../domain/ports/injection-tokens';

// Infrastructure adapters
import { ExpensePrismaRepository } from '../../infrastructure/persistence/expense-prisma.repository';
import { AccountPrismaRepository } from '../../infrastructure/persistence/account-prisma.repository';
import { ImportsPrismaRepository } from '../../infrastructure/persistence/imports-prisma.repository';

// Guards
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';

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
    UpdateExpenseUseCase,
    DeleteExpenseUseCase,

    // Queries
    GetExpensesQuery,
    GetExpenseQuery,

    // Event handlers
    ExpenseAssignedHandler,
    ExpenseImportedHandler,

    // Guards
    GroupMemberGuard,

    // Port → Adapter bindings
    { provide: EXPENSE_REPOSITORY_PORT,  useClass: ExpensePrismaRepository },
    { provide: ACCOUNT_REPOSITORY_PORT,  useClass: AccountPrismaRepository },
    { provide: IMPORTS_REPOSITORY_PORT,  useClass: ImportsPrismaRepository },
  ],
})
export class ExpensesModule {}

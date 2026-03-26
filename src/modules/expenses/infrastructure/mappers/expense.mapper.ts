import type {
  Expense as PrismaExpense,
  Assignment as PrismaAssignment,
  ExpenseSource as PrismaExpenseSource,
  ExpenseStatus as PrismaExpenseStatus,
} from '@prisma/client';
import { Expense, ExpenseSource, ExpenseStatus } from '../../domain/entities/expense.entity';
import { Assignment } from '../../domain/entities/assignment.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { Percentage } from '../../domain/value-objects/percentage.vo';
import { ImportHash } from '../../domain/value-objects/import-hash.vo';

// ── Expense Mapper ────────────────────────────────────────────────────────────

export class ExpenseMapper {
  /**
   * Prisma row (with optional eager-loaded assignments) → Domain aggregate.
   * Always use Expense.reconstitute — never Expense.create (which emits events).
   */
  static toDomain(
    raw: PrismaExpense & { assignments?: PrismaAssignment[] },
  ): Expense {
    const amount = Money.create(Number(raw.amount), raw.currency);

    const importHash = raw.importHash ? ImportHash.create(raw.importHash) : undefined;

    const assignments = (raw.assignments ?? []).map((a) =>
      Assignment.create({
        id: a.id,
        expenseId: a.expenseId,
        memberId: a.memberId,
        percentage: Percentage.create(Number(a.percentage)),
      }).getOrThrow(),
    );

    return Expense.reconstitute({
      id: raw.id,
      groupId: raw.groupId,
      accountId: raw.accountId ?? undefined,
      categoryId: raw.categoryId ?? undefined,
      description: raw.description,
      amount,
      // Prisma enum string values match domain enum string values exactly
      source: raw.source as unknown as ExpenseSource,
      status: raw.status as unknown as ExpenseStatus,
      importHash,
      date: raw.date,
      month: raw.month,
      year: raw.year,
      assignments,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Domain aggregate → plain object accepted by Prisma upsert/create.
   * Does NOT include assignments — those are managed separately in the repository.
   */
  static toPrisma(expense: Expense): {
    id: string;
    groupId: string;
    accountId: string | null;
    categoryId: string | null;
    description: string;
    amount: number;
    currency: string;
    source: PrismaExpenseSource;
    status: PrismaExpenseStatus;
    date: Date;
    month: string;
    year: string;
    importHash: string | null;
    importId: string | null;
  } {
    return {
      id: expense.id,
      groupId: expense.groupId,
      accountId: expense.accountId ?? null,
      categoryId: expense.categoryId ?? null,
      description: expense.description,
      amount: expense.amount.amount,
      currency: expense.amount.currency,
      source: expense.source as unknown as PrismaExpenseSource,
      status: expense.status as unknown as PrismaExpenseStatus,
      date: expense.date,
      month: expense.month,
      year: expense.year,
      importHash: expense.importHash?.value ?? null,
      importId: null, // linked by ConfirmImportUseCase after Import record is created
    };
  }
}

// ── Assignment Mapper ─────────────────────────────────────────────────────────

export class AssignmentMapper {
  static toPrisma(a: Assignment): {
    id: string;
    expenseId: string;
    memberId: string;
    percentage: number;
  } {
    return {
      id: a.id,
      expenseId: a.expenseId,
      memberId: a.memberId,
      percentage: a.percentage.value,
    };
  }
}

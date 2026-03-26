import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  IExpenseRepository,
  ExpenseFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/ports/expense-repository.port';
import { Expense } from '../../domain/entities/expense.entity';
import { ImportHash } from '../../domain/value-objects/import-hash.vo';
import { ExpenseMapper, AssignmentMapper } from '../mappers/expense.mapper';

@Injectable()
export class ExpensePrismaRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reads ──────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Expense | null> {
    const raw = await this.prisma.expense.findUnique({
      where: { id },
      include: { assignments: true },
    });
    return raw ? ExpenseMapper.toDomain(raw) : null;
  }

  async findByGroupId(
    groupId: string,
    filters: ExpenseFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Expense>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { groupId };
    if (filters.status)     where['status']     = filters.status;
    if (filters.month)      where['month']      = filters.month;
    if (filters.year)       where['year']       = filters.year;
    if (filters.accountId)  where['accountId']  = filters.accountId;
    if (filters.categoryId) where['categoryId'] = filters.categoryId;

    const skip = (pagination.page - 1) * pagination.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: { assignments: true },
        skip,
        take: pagination.limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      items: items.map((item) => ExpenseMapper.toDomain(item)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async findByHash(hash: ImportHash): Promise<Expense | null> {
    const raw = await this.prisma.expense.findUnique({
      where: { importHash: hash.value },
      include: { assignments: true },
    });
    return raw ? ExpenseMapper.toDomain(raw) : null;
  }

  // ── Writes ─────────────────────────────────────────────────────────────────

  /**
   * Upserts the expense and fully syncs its assignments in a single transaction.
   * Assignments are always replaced (delete-all + create-new) to stay consistent
   * with domain semantics: assign() replaces the entire set.
   */
  async save(expense: Expense): Promise<void> {
    const data = ExpenseMapper.toPrisma(expense);
    const assignmentsData = expense.assignments.map(AssignmentMapper.toPrisma);

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.upsert({
        where: { id: expense.id },
        create: data,
        update: data,
      });

      // Always sync assignments to reflect the current domain state
      await tx.assignment.deleteMany({ where: { expenseId: expense.id } });
      if (assignmentsData.length > 0) {
        await tx.assignment.createMany({ data: assignmentsData });
      }
    });
  }

  /**
   * Batch-creates expenses in a single transaction.
   * Used by ConfirmImportUseCase — imported expenses have no assignments yet.
   */
  async saveMany(expenses: Expense[]): Promise<void> {
    if (expenses.length === 0) return;
    await this.prisma.$transaction(
      expenses.map((e) => this.prisma.expense.create({ data: ExpenseMapper.toPrisma(e) })),
    );
  }

  async delete(id: string): Promise<void> {
    // onDelete: Cascade on Assignment removes assignments automatically
    await this.prisma.expense.delete({ where: { id } });
  }

  /**
   * Atomic: deletes originals (Cascade removes their assignments) and creates
   * the new grouped expense with its inherited assignments — all in one transaction.
   */
  async replaceWithGrouped(deletedIds: string[], newExpense: Expense): Promise<void> {
    const data = ExpenseMapper.toPrisma(newExpense);
    const assignmentsData = newExpense.assignments.map(AssignmentMapper.toPrisma);

    await this.prisma.$transaction(async (tx) => {
      // Cascade deletes assignments of the originals
      await tx.expense.deleteMany({ where: { id: { in: deletedIds } } });

      await tx.expense.create({ data });

      if (assignmentsData.length > 0) {
        await tx.assignment.createMany({ data: assignmentsData });
      }
    });
  }
}

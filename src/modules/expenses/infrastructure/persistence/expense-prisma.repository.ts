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
import { ExpenseMapper } from '../mappers/expense.mapper';

@Injectable()
export class ExpensePrismaRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Expense | null> {
    const raw = await this.prisma.expense.findUnique({ where: { id } });
    if (!raw) return null;
    return ExpenseMapper.toDomain(raw);
  }

  async findByGroupId(
    groupId: string,
    filters: ExpenseFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Expense>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { groupId };
    // TODO: enable these filters after Prisma migration adds the columns
    if (filters.month) where['month'] = filters.month;
    if (filters.year) where['year'] = filters.year;
    if (filters.accountId) where['accountId'] = filters.accountId;
    if (filters.categoryId) where['categoryId'] = filters.categoryId;
    if (filters.status) where['status'] = filters.status;

    const skip = (pagination.page - 1) * pagination.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
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
    // TODO: requires importHash column — added via Prisma migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await this.prisma.expense.findFirst({ where: { importHash: hash.value } as any });
    if (!raw) return null;
    return ExpenseMapper.toDomain(raw);
  }

  async save(expense: Expense): Promise<void> {
    const data = ExpenseMapper.toPersistence(expense);
    await this.prisma.expense.upsert({
      where: { id: expense.id },
      create: data,
      update: data,
    });
  }

  async saveMany(expenses: Expense[]): Promise<void> {
    await this.prisma.$transaction(
      expenses.map((e) =>
        this.prisma.expense.upsert({
          where: { id: e.id },
          create: ExpenseMapper.toPersistence(e),
          update: ExpenseMapper.toPersistence(e),
        }),
      ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.expense.delete({ where: { id } });
  }

  async replaceWithGrouped(deletedIds: string[], newExpense: Expense): Promise<void> {
    const data = ExpenseMapper.toPersistence(newExpense);
    await this.prisma.$transaction([
      this.prisma.expense.deleteMany({ where: { id: { in: deletedIds } } }),
      this.prisma.expense.create({ data }),
    ]);
  }
}

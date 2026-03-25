import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  IExpenseRepository,
  ExpenseFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/ports/expense-repository.port';
import { Expense } from '../../domain/entities/expense.entity';
import { Result, ok, err } from '../../../../shared/result/result';
import { DomainError, NotFoundError } from '../../../../shared/errors/domain.errors';
import { ExpenseMapper } from '../mappers/expense.mapper';

@Injectable()
export class ExpensePrismaRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Result<Expense, DomainError>> {
    const raw = await this.prisma.expense.findUnique({
      where: { id },
      include: { splits: true },
    });

    if (!raw) {
      return err(new NotFoundError(`Expense ${id} not found`));
    }

    return ok(ExpenseMapper.toDomain(raw));
  }

  async findAll(
    filters: ExpenseFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Expense>> {
    const where: Prisma.ExpenseWhereInput = {};

    if (filters.paidById) where.paidById = filters.paidById;
    if (filters.groupId) where.groupId = filters.groupId;
    if (filters.currency) where.currency = filters.currency;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {
        ...(filters.fromDate && { gte: filters.fromDate }),
        ...(filters.toDate && { lte: filters.toDate }),
      };
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: { splits: true },
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

  async save(expense: Expense): Promise<Result<Expense, DomainError>> {
    try {
      const data = ExpenseMapper.toPersistence(expense);
      const raw = await this.prisma.expense.create({
        data: {
          ...data,
          splits: {
            create: expense.splits.map((s) => ({
              userId: s.userId,
              amount: s.amount.amount,
              settled: s.settled,
            })),
          },
        },
        include: { splits: true },
      });

      return ok(ExpenseMapper.toDomain(raw));
    } catch (error) {
      return err(
        new DomainError(`Failed to persist expense: ${String(error)}`, 'PERSISTENCE_ERROR'),
      );
    }
  }

  async update(expense: Expense): Promise<Result<Expense, DomainError>> {
    try {
      const data = ExpenseMapper.toPersistence(expense);
      const raw = await this.prisma.expense.update({
        where: { id: expense.id },
        data: {
          ...data,
          splits: {
            deleteMany: {},
            create: expense.splits.map((s) => ({
              userId: s.userId,
              amount: s.amount.amount,
              settled: s.settled,
            })),
          },
        },
        include: { splits: true },
      });

      return ok(ExpenseMapper.toDomain(raw));
    } catch (error) {
      return err(
        new DomainError(`Failed to update expense: ${String(error)}`, 'PERSISTENCE_ERROR'),
      );
    }
  }

  async delete(id: string): Promise<Result<void, DomainError>> {
    try {
      await this.prisma.expense.delete({ where: { id } });
      return ok(undefined);
    } catch {
      return err(new NotFoundError(`Expense ${id} not found`));
    }
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.expense.count({ where: { id } });
    return count > 0;
  }
}

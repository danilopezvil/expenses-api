// TODO: This mapper requires a Prisma migration that adds the new Expense columns:
//   source, status, importHash, date, month, year
// Until then it is intentionally stubbed to keep the build green.

import { Expense as PrismaExpense } from '@prisma/client';
import { Expense, ExpenseSource, ExpenseStatus } from '../../domain/entities/expense.entity';
import { Money } from '../../domain/value-objects/money.vo';

export class ExpenseMapper {
  static toDomain(raw: PrismaExpense): Expense {
    const result = Expense.reconstitute({
      id: raw.id,
      groupId: raw.groupId ?? '',
      description: raw.title,
      amount: Money.create(Number(raw.amount), raw.currency),
      source: ExpenseSource.MANUAL,
      status: ExpenseStatus.PENDING,
      date: raw.createdAt,
      month: String(raw.createdAt.getMonth() + 1).padStart(2, '0'),
      year: String(raw.createdAt.getFullYear()),
      assignments: [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
    return result;
  }

  static toPersistence(expense: Expense) {
    return {
      id: expense.id,
      title: expense.description,
      description: expense.description,
      amount: expense.amount.amount,
      currency: expense.amount.currency,
      category: 'OTHER' as const,
      paidById: '',
      groupId: expense.groupId,
    };
  }
}

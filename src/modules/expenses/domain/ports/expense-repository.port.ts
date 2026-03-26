import { Expense } from '../entities/expense.entity';
import { ImportHash } from '../value-objects/import-hash.vo';
import { ExpenseStatus } from '../entities/expense.entity';

export interface ExpenseFilters {
  status?: ExpenseStatus;
  month?: string;
  year?: string;
  categoryId?: string;
  accountId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const EXPENSE_REPOSITORY = Symbol('IExpenseRepository');

export interface IExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  findByGroupId(groupId: string, filters: ExpenseFilters, pagination: PaginationOptions): Promise<PaginatedResult<Expense>>;
  findByHash(hash: ImportHash): Promise<Expense | null>;
  save(expense: Expense): Promise<void>;
  saveMany(expenses: Expense[]): Promise<void>;
  delete(id: string): Promise<void>;
  /**
   * Atomic: deletes `deletedIds` and saves `newExpense` in a single transaction.
   * Used by GroupExpensesUseCase.
   */
  replaceWithGrouped(deletedIds: string[], newExpense: Expense): Promise<void>;
}

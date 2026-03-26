import { ExpenseSource } from '../../domain/entities/expense.entity';

// ── CreateExpense ────────────────────────────────────────────────────────────

export interface CreateExpenseAppDto {
  groupId: string;
  accountId?: string;
  description: string;
  amount: number;
  currency?: string;
  source?: ExpenseSource;
  date: string | Date;
}

// ── AssignExpense ────────────────────────────────────────────────────────────

export interface AssignmentItemDto {
  memberId: string;
  percentage: number;
}

export interface AssignExpenseAppDto {
  expenseId: string;
  assignments: AssignmentItemDto[];
}

// ── GroupExpenses ────────────────────────────────────────────────────────────

export interface GroupExpensesAppDto {
  expenseIds: string[];
  description: string;
  accountId?: string;
}

// ── PreviewImport ────────────────────────────────────────────────────────────

export interface PreviewImportAppDto {
  groupId: string;
  rawText: string;
  year: number;
  currency?: string;
}

// ── ConfirmImport ────────────────────────────────────────────────────────────

export interface ConfirmImportAppDto {
  groupId: string;
  rawText: string;
  year: number;
  currency?: string;
  skipDuplicates?: boolean;
}

import { ExpenseSource, ExpenseStatus } from '../../domain/entities/expense.entity';

// ── Expense ──────────────────────────────────────────────────────────────────

export interface AssignmentResponseDto {
  id: string;
  memberId: string;
  percentage: number;
}

export interface ExpenseResponseDto {
  id: string;
  groupId: string;
  accountId?: string;
  categoryId?: string;
  description: string;
  amount: number;
  currency: string;
  source: ExpenseSource;
  status: ExpenseStatus;
  importHash?: string;
  date: Date;
  month: string;
  year: string;
  assignments: AssignmentResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseListItemDto {
  id: string;
  groupId: string;
  accountId?: string;
  categoryId?: string;
  description: string;
  amount: number;
  currency: string;
  source: ExpenseSource;
  status: ExpenseStatus;
  date: Date;
  month: string;
  year: string;
  assignmentCount: number;
}

// ── PreviewImport ────────────────────────────────────────────────────────────

export interface PreviewItemDto {
  date: Date;
  description: string;
  amount: number;
  currency: string;
  hash: string;
  isDuplicate: boolean;
}

export interface PreviewImportResponseDto {
  parsed: PreviewItemDto[];
  parseErrors: Array<{ lineNumber: number; rawLine: string; reason: string }>;
  totalAmount: number;
  currency: string;
  count: number;
  duplicateCount: number;
}

// ── ConfirmImport ────────────────────────────────────────────────────────────

export interface ConfirmImportResultDto {
  imported: number;
  skipped: number;
  parseErrors: number;
  totalAmount: number;
}

// ── GroupExpenses ────────────────────────────────────────────────────────────

export interface GroupExpensesResultDto {
  id: string;
  amount: number;
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface ByMemberDto {
  memberId: string;
  name: string;
  totalAssigned: number;
  currency: string;
}

export interface ByCategoryDto {
  categoryId: string;
  total: number;
  currency: string;
}

export interface ByAccountDto {
  accountId: string;
  name: string;
  total: number;
  currency: string;
}

export interface TopExpenseDto {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
}

export interface DashboardDto {
  totalExpenses: number;
  totalAmount: number;
  currency: string;
  byMember: ByMemberDto[];
  byCategory: ByCategoryDto[];
  byAccount: ByAccountDto[];
  unassigned: number;
  topExpenses: TopExpenseDto[];
}

// ── Reconciliation ───────────────────────────────────────────────────────────

export type ReconciliationStatus = 'SETTLED' | 'OWES' | 'OWED';

export interface ReconciliationItemDto {
  memberId: string;
  name: string;
  color: string;
  totalAssigned: number;
  totalPaid: number;
  balance: number;
  status: ReconciliationStatus;
}

// ── Query filters ────────────────────────────────────────────────────────────

export interface GetExpensesFiltersDto {
  groupId: string;
  month?: string;
  year?: string;
  accountId?: string;
  categoryId?: string;
  search?: string;
  assigned?: boolean;
  status?: ExpenseStatus;
  page?: number;
  limit?: number;
}

export interface GetDashboardFiltersDto {
  groupId: string;
  month?: string;
  year?: string;
}

export interface GetReconciliationFiltersDto {
  groupId: string;
  month?: string;
  year?: string;
}

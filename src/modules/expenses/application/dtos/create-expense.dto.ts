import { ExpenseCategoryEnum } from '../../domain/value-objects/expense-category.vo';

export interface CreateExpenseDto {
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category?: ExpenseCategoryEnum;
  paidById: string;
  groupId?: string;
  splitBetween?: string[];
}

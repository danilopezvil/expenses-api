import { ExpenseCategoryEnum } from '../../domain/value-objects/expense-category.vo';

export interface ExpenseSplitDto {
  userId: string;
  amount: number;
  currency: string;
  settled: boolean;
}

export interface ExpenseResponseDto {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryEnum;
  paidById: string;
  groupId?: string;
  splits: ExpenseSplitDto[];
  createdAt: Date;
  updatedAt: Date;
}

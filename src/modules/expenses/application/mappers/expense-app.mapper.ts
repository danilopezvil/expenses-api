import { Expense } from '../../domain/entities/expense.entity';
import { ExpenseResponseDto, ExpenseListItemDto } from '../dtos/app-responses.dto';

export class ExpenseAppMapper {
  static toResponseDto(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      groupId: expense.groupId,
      accountId: expense.accountId,
      categoryId: expense.categoryId,
      description: expense.description,
      amount: expense.amount.amount,
      currency: expense.amount.currency,
      source: expense.source,
      status: expense.status,
      importHash: expense.importHash?.value,
      date: expense.date,
      month: expense.month,
      year: expense.year,
      assignments: expense.assignments.map((a) => ({
        id: a.id,
        memberId: a.memberId,
        percentage: a.percentage.value,
      })),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  static toListItemDto(expense: Expense): ExpenseListItemDto {
    return {
      id: expense.id,
      groupId: expense.groupId,
      accountId: expense.accountId,
      categoryId: expense.categoryId,
      description: expense.description,
      amount: expense.amount.amount,
      currency: expense.amount.currency,
      source: expense.source,
      status: expense.status,
      date: expense.date,
      month: expense.month,
      year: expense.year,
      assignmentCount: expense.assignments.length,
    };
  }
}

import { EventBus } from '@nestjs/cqrs';
import { GroupExpensesUseCase } from '../use-cases/group-expenses.use-case';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { ExpenseGrouperService } from '../../domain/services/expense-grouper.service';
import { Expense, ExpenseSource, ExpenseStatus } from '../../domain/entities/expense.entity';
import { Assignment } from '../../domain/entities/assignment.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { Percentage } from '../../domain/value-objects/percentage.vo';
import { ValidationError } from '../../../../shared/errors/domain.errors';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeAssignment(memberId: string, pct: number, expenseId: string): Assignment {
  return Assignment.create({
    id: `assignment-${memberId}`,
    expenseId,
    memberId,
    percentage: Percentage.create(pct),
  }).getOrThrow();
}

function makeExpense(
  id: string,
  amount: number,
  assignments: Assignment[] = [],
): Expense {
  const expense = Expense.reconstitute({
    id,
    groupId: 'group-1',
    description: `Expense ${id}`,
    amount: Money.create(amount, 'USD'),
    source: ExpenseSource.CARD,
    status: ExpenseStatus.PENDING,
    date: new Date('2024-03-15'),
    month: '03',
    year: '2024',
    assignments,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return expense;
}

function makeRepo(): jest.Mocked<IExpenseRepository> {
  return {
    findById: jest.fn(),
    findByGroupId: jest.fn(),
    findByHash: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    saveMany: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    replaceWithGrouped: jest.fn().mockResolvedValue(undefined),
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('GroupExpensesUseCase', () => {
  let useCase: GroupExpensesUseCase;
  let repo: jest.Mocked<IExpenseRepository>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;

  beforeEach(() => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    useCase = new GroupExpensesUseCase(repo, new ExpenseGrouperService(), eventBus as unknown as EventBus);
  });

  it('returns err when fewer than 2 expense IDs are provided', async () => {
    const e1 = makeExpense('e1', 50);
    repo.findById.mockResolvedValue(e1);

    const result = await useCase.execute({
      expenseIds: ['e1'],
      description: 'Grouped',
    });

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('narrowing');
    expect(result.error).toBeInstanceOf(ValidationError);
  });

  it('returns err when one of the expenses is not found', async () => {
    repo.findById
      .mockResolvedValueOnce(makeExpense('e1', 50))
      .mockResolvedValueOnce(null);

    const result = await useCase.execute({
      expenseIds: ['e1', 'e2'],
      description: 'Grouped',
    });

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('narrowing');
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns ok with inherited assignments when all expenses share identical assignments', async () => {
    const a1 = makeAssignment('alice', 60, 'e1');
    const a2 = makeAssignment('bob', 40, 'e1');
    const a3 = makeAssignment('alice', 60, 'e2');
    const a4 = makeAssignment('bob', 40, 'e2');

    // Pre-assign both expenses
    const e1 = makeExpense('e1', 80);
    const e2 = makeExpense('e2', 120);
    e1.assign([a1, a2]);
    e2.assign([a3, a4]);

    repo.findById.mockResolvedValueOnce(e1).mockResolvedValueOnce(e2);

    const result = await useCase.execute({
      expenseIds: ['e1', 'e2'],
      description: 'Grouped expense',
    });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.amount).toBe(200);
    // replaceWithGrouped called with the new expense that has 2 assignments
    const [deletedIds, newExpense] = (repo.replaceWithGrouped as jest.Mock).mock.calls[0] as [string[], Expense];
    expect(deletedIds).toEqual(['e1', 'e2']);
    expect(newExpense.assignments).toHaveLength(2);
  });

  it('returns ok without assignments when expenses have different assignments', async () => {
    const e1 = makeExpense('e1', 80);
    const e2 = makeExpense('e2', 120);
    // e1: alice 100%, e2: bob 100%
    e1.assign([makeAssignment('alice', 100, 'e1')]);
    e2.assign([makeAssignment('bob', 100, 'e2')]);

    repo.findById.mockResolvedValueOnce(e1).mockResolvedValueOnce(e2);

    const result = await useCase.execute({
      expenseIds: ['e1', 'e2'],
      description: 'Grouped',
    });

    expect(result.isOk()).toBe(true);
    const [, newExpense] = (repo.replaceWithGrouped as jest.Mock).mock.calls[0] as [string[], Expense];
    expect(newExpense.assignments).toHaveLength(0);
  });

  it('total amount is the sum of all grouped expense amounts', async () => {
    repo.findById
      .mockResolvedValueOnce(makeExpense('e1', 45.5))
      .mockResolvedValueOnce(makeExpense('e2', 54.5));

    const result = await useCase.execute({
      expenseIds: ['e1', 'e2'],
      description: 'Sum check',
    });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.amount).toBe(100);
  });

  it('calls replaceWithGrouped with original IDs and new expense', async () => {
    repo.findById
      .mockResolvedValueOnce(makeExpense('e1', 50))
      .mockResolvedValueOnce(makeExpense('e2', 50));

    await useCase.execute({ expenseIds: ['e1', 'e2'], description: 'Grouped' });

    expect(repo.replaceWithGrouped).toHaveBeenCalledWith(
      ['e1', 'e2'],
      expect.objectContaining({ description: 'Grouped' }),
    );
  });
});

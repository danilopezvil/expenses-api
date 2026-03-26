import { EventBus } from '@nestjs/cqrs';
import { AssignExpenseUseCase } from '../use-cases/assign-expense.use-case';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { Expense, ExpenseSource, ExpenseStatus } from '../../domain/entities/expense.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { ValidationError } from '../../../../shared/errors/domain.errors';
import { ExpenseAssignedEvent } from '../../domain/events/expense-assigned.event';

// ── helpers ─────────────────────────────────────────────────────────────────

function makeExpense(overrides: Partial<Parameters<typeof Expense.reconstitute>[0]> = {}): Expense {
  return Expense.reconstitute({
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Test expense',
    amount: Money.create(100, 'USD'),
    source: ExpenseSource.CARD,
    status: ExpenseStatus.PENDING,
    date: new Date('2024-03-15'),
    month: '03',
    year: '2024',
    assignments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
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

// ── tests ────────────────────────────────────────────────────────────────────

describe('AssignExpenseUseCase', () => {
  let useCase: AssignExpenseUseCase;
  let repo: jest.Mocked<IExpenseRepository>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;

  beforeEach(() => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    useCase = new AssignExpenseUseCase(repo, eventBus as unknown as EventBus);
  });

  it('returns err(NotFoundError) when expense does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      expenseId: 'missing',
      assignments: [{ memberId: 'member-1', percentage: 100 }],
    });

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('narrowing');
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns err(ValidationError) when percentages do not sum to 100', async () => {
    repo.findById.mockResolvedValue(makeExpense());

    const result = await useCase.execute({
      expenseId: 'expense-1',
      assignments: [{ memberId: 'member-1', percentage: 50 }],
    });

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('narrowing');
    expect(result.error).toBeInstanceOf(ValidationError);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns err(ValidationError) when a percentage is out of range (0)', async () => {
    repo.findById.mockResolvedValue(makeExpense());

    const result = await useCase.execute({
      expenseId: 'expense-1',
      assignments: [{ memberId: 'member-1', percentage: 0 }],
    });

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) throw new Error('narrowing');
    expect(result.error).toBeInstanceOf(ValidationError);
  });

  it('returns ok and persists when assignments are valid (single 100%)', async () => {
    repo.findById.mockResolvedValue(makeExpense());

    const result = await useCase.execute({
      expenseId: 'expense-1',
      assignments: [{ memberId: 'member-1', percentage: 100 }],
    });

    expect(result.isOk()).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('returns ok and persists when assignments are valid (split 60/40)', async () => {
    repo.findById.mockResolvedValue(makeExpense());

    const result = await useCase.execute({
      expenseId: 'expense-1',
      assignments: [
        { memberId: 'member-1', percentage: 60 },
        { memberId: 'member-2', percentage: 40 },
      ],
    });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.assignments).toHaveLength(2);
  });

  it('publishes ExpenseAssignedEvent after successful assign', async () => {
    repo.findById.mockResolvedValue(makeExpense());

    await useCase.execute({
      expenseId: 'expense-1',
      assignments: [{ memberId: 'member-1', percentage: 100 }],
    });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const published = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(published).toBeInstanceOf(ExpenseAssignedEvent);
  });

  it('response DTO reflects the assigned percentages', async () => {
    repo.findById.mockResolvedValue(makeExpense());

    const result = await useCase.execute({
      expenseId: 'expense-1',
      assignments: [
        { memberId: 'alice', percentage: 70 },
        { memberId: 'bob', percentage: 30 },
      ],
    });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    const aliceAssignment = result.value.assignments.find((a) => a.memberId === 'alice');
    expect(aliceAssignment?.percentage).toBe(70);
  });
});

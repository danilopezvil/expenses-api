import { Expense, ExpenseSource, ExpenseStatus } from '../entities/expense.entity';
import { Assignment } from '../entities/assignment.entity';
import { Money } from '../value-objects/money.vo';
import { Percentage } from '../value-objects/percentage.vo';
import { ExpenseCreatedEvent } from '../events/expense-created.event';
import { ExpenseAssignedEvent } from '../events/expense-assigned.event';

const baseInput = () => ({
  id: 'exp-1',
  groupId: 'group-1',
  description: 'Groceries',
  amount: Money.create(100, 'USD'),
  source: ExpenseSource.CARD,
  date: new Date(2024, 2, 15),
});

const makeAssignment = (memberId: string, pct: number) =>
  Assignment.create({
    id: `a-${memberId}`,
    expenseId: 'exp-1',
    memberId,
    percentage: Percentage.create(pct),
  }).getOrThrow();

describe('Expense entity', () => {
  it('create() returns Ok with default PENDING status', () => {
    const result = Expense.create(baseInput());
    expect(result.isOk()).toBe(true);
    expect(result.getOrThrow().status).toBe(ExpenseStatus.PENDING);
  });

  it('create() returns Err when id is missing', () => {
    const result = Expense.create({ ...baseInput(), id: '' });
    expect(result.isErr()).toBe(true);
  });

  it('create() returns Err when description is blank', () => {
    const result = Expense.create({ ...baseInput(), description: '   ' });
    expect(result.isErr()).toBe(true);
  });

  it('create() emits an ExpenseCreatedEvent', () => {
    const expense = Expense.create(baseInput()).getOrThrow();
    const events = expense.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ExpenseCreatedEvent);
  });

  it('create() derives month and year from date', () => {
    const expense = Expense.create(baseInput()).getOrThrow(); // date: 2024-03-15
    expect(expense.month).toBe('03');
    expect(expense.year).toBe('2024');
  });

  it('assign() succeeds when percentages sum to 100', () => {
    const expense = Expense.create(baseInput()).getOrThrow();
    const assignments = [makeAssignment('m1', 60), makeAssignment('m2', 40)];
    const result = expense.assign(assignments);
    expect(result.isOk()).toBe(true);
    expect(expense.assignments).toHaveLength(2);
  });

  it('assign() emits ExpenseAssignedEvent', () => {
    const expense = Expense.create(baseInput()).getOrThrow();
    expense.pullDomainEvents(); // clear created event
    expense.assign([makeAssignment('m1', 100)]);
    const events = expense.pullDomainEvents();
    expect(events[0]).toBeInstanceOf(ExpenseAssignedEvent);
  });

  it('assign() returns Err when percentages do not sum to 100', () => {
    const expense = Expense.create(baseInput()).getOrThrow();
    const result = expense.assign([makeAssignment('m1', 60), makeAssignment('m2', 30)]);
    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.message).toContain('100');
  });

  it('void() changes status to VOIDED', () => {
    const expense = Expense.create(baseInput()).getOrThrow();
    const result = expense.void();
    expect(result.isOk()).toBe(true);
    expect(expense.status).toBe(ExpenseStatus.VOIDED);
  });

  it('void() returns Err when already VOIDED', () => {
    const expense = Expense.create(baseInput()).getOrThrow();
    expense.void();
    const result = expense.void();
    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.message).toContain('voided');
  });

  it('classify() sets categoryId and changes status to CLASSIFIED from PENDING', () => {
    const expense = Expense.create(baseInput()).getOrThrow();
    expense.classify('cat-42');
    expect(expense.status).toBe(ExpenseStatus.CLASSIFIED);
    expect(expense.categoryId).toBe('cat-42');
  });

  it('classify() does nothing when status is VOIDED', () => {
    const expense = Expense.create(baseInput()).getOrThrow();
    expense.void();
    expense.classify('cat-42');
    expect(expense.status).toBe(ExpenseStatus.VOIDED);
    expect(expense.categoryId).toBeUndefined();
  });
});

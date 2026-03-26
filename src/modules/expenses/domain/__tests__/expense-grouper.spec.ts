import { ExpenseGrouperService } from '../services/expense-grouper.service';
import { Expense, ExpenseSource, ExpenseStatus } from '../entities/expense.entity';
import { Assignment } from '../entities/assignment.entity';
import { Money } from '../value-objects/money.vo';
import { Percentage } from '../value-objects/percentage.vo';

const makeExpense = (id: string, groupId: string, amount: number) =>
  Expense.create({
    id,
    groupId,
    description: `Expense ${id}`,
    amount: Money.create(amount, 'USD'),
    source: ExpenseSource.CARD,
    date: new Date(2024, 0, 1),
  }).getOrThrow();

const makeAssignment = (expenseId: string, memberId: string, pct: number) =>
  Assignment.create({
    id: `a-${expenseId}-${memberId}`,
    expenseId,
    memberId,
    percentage: Percentage.create(pct),
  }).getOrThrow();

describe('ExpenseGrouperService', () => {
  let service: ExpenseGrouperService;

  beforeEach(() => {
    service = new ExpenseGrouperService();
  });

  it('returns Err when fewer than 2 expenses are provided', () => {
    const result = service.group([makeExpense('e1', 'g1', 50)], 'merged');
    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.message).toContain('2');
  });

  it('returns Err when expenses belong to different groups', () => {
    const e1 = makeExpense('e1', 'group-A', 50);
    const e2 = makeExpense('e2', 'group-B', 30);
    const result = service.group([e1, e2], 'merged');
    expect(result.isErr()).toBe(true);
  });

  it('returns Err when any expense is VOIDED', () => {
    const e1 = makeExpense('e1', 'g1', 50);
    const e2 = makeExpense('e2', 'g1', 30);
    e2.void();
    const result = service.group([e1, e2], 'merged');
    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.message).toContain('voided');
  });

  it('computes correct totalAmount', () => {
    const e1 = makeExpense('e1', 'g1', 50);
    const e2 = makeExpense('e2', 'g1', 30.50);
    const result = service.group([e1, e2], 'merged');
    expect(result.isOk()).toBe(true);
    expect(result.getOrThrow().totalAmount.amount).toBe(80.50);
  });

  it('returns inheritedAssignments when all expenses share identical assignments', () => {
    const e1 = makeExpense('e1', 'g1', 100);
    const e2 = makeExpense('e2', 'g1', 200);
    e1.assign([makeAssignment('e1', 'm1', 60), makeAssignment('e1', 'm2', 40)]);
    e2.assign([makeAssignment('e2', 'm1', 60), makeAssignment('e2', 'm2', 40)]);

    const result = service.group([e1, e2], 'merged');
    expect(result.isOk()).toBe(true);
    expect(result.getOrThrow().inheritedAssignments).not.toBeNull();
    expect(result.getOrThrow().inheritedAssignments).toHaveLength(2);
  });

  it('returns inheritedAssignments=null when assignments differ', () => {
    const e1 = makeExpense('e1', 'g1', 100);
    const e2 = makeExpense('e2', 'g1', 200);
    e1.assign([makeAssignment('e1', 'm1', 60), makeAssignment('e1', 'm2', 40)]);
    e2.assign([makeAssignment('e2', 'm1', 70), makeAssignment('e2', 'm2', 30)]);

    const result = service.group([e1, e2], 'merged');
    expect(result.isOk()).toBe(true);
    expect(result.getOrThrow().inheritedAssignments).toBeNull();
  });
});

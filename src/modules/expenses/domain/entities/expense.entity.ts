import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { Result, ok, err } from '../../../../shared/result/result';
import { DomainError, ValidationError } from '../../../../shared/errors/domain.errors';
import { Money } from '../value-objects/money.vo';
import { ImportHash } from '../value-objects/import-hash.vo';
import { Percentage } from '../value-objects/percentage.vo';
import { Assignment } from './assignment.entity';
import { ExpenseCreatedEvent } from '../events/expense-created.event';
import { ExpenseAssignedEvent } from '../events/expense-assigned.event';

export enum ExpenseSource {
  CARD = 'CARD',
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  CLASSIFIED = 'CLASSIFIED',
  ASSIGNED = 'ASSIGNED',
  VOIDED = 'VOIDED',
  IMPORTED = 'IMPORTED',
}

export interface ExpenseProps {
  id: string;
  groupId: string;
  accountId?: string;
  categoryId?: string;
  description: string;
  amount: Money;
  source: ExpenseSource;
  status: ExpenseStatus;
  importHash?: ImportHash;
  date: Date;
  month: string;
  year: string;
  assignments: Assignment[];
  createdAt: Date;
  updatedAt: Date;
}

type CreateInput = Omit<ExpenseProps, 'month' | 'year' | 'assignments' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: ExpenseStatus;
};

export class Expense extends AggregateRoot {
  private constructor(private props: ExpenseProps) {
    super();
  }

  static create(input: CreateInput): Result<Expense, ValidationError> {
    if (!input.id?.trim()) {
      return err(new ValidationError('Expense id is required'));
    }
    if (!input.groupId?.trim()) {
      return err(new ValidationError('Expense groupId is required'));
    }
    if (!input.description?.trim()) {
      return err(new ValidationError('Expense description is required'));
    }

    const now = new Date();
    const month = String(input.date.getMonth() + 1).padStart(2, '0');
    const year = String(input.date.getFullYear());

    const expense = new Expense({
      ...input,
      status: input.status ?? ExpenseStatus.PENDING,
      month,
      year,
      assignments: [],
      createdAt: now,
      updatedAt: now,
    });

    expense.addDomainEvent(new ExpenseCreatedEvent(expense));
    return ok(expense);
  }

  static reconstitute(props: ExpenseProps): Expense {
    return new Expense(props);
  }

  assign(assignments: Assignment[]): Result<void, ValidationError> {
    if (assignments.length === 0) {
      return err(new ValidationError('At least one assignment is required'));
    }
    const percentages = assignments.map((a) => a.percentage);
    if (!Percentage.validateSum(percentages)) {
      return err(new ValidationError('Assignment percentages must sum to 100'));
    }
    this.props.assignments = [...assignments];
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ExpenseAssignedEvent(this, assignments));
    return ok(undefined);
  }

  void(): Result<void, DomainError> {
    if (this.props.status === ExpenseStatus.VOIDED) {
      return err(new ValidationError('Expense is already voided'));
    }
    this.props.status = ExpenseStatus.VOIDED;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  classify(categoryId: string): void {
    if (
      this.props.status === ExpenseStatus.PENDING ||
      this.props.status === ExpenseStatus.IMPORTED
    ) {
      this.props.categoryId = categoryId;
      this.props.status = ExpenseStatus.CLASSIFIED;
      this.props.updatedAt = new Date();
    }
  }

  get id(): string { return this.props.id; }
  get groupId(): string { return this.props.groupId; }
  get accountId(): string | undefined { return this.props.accountId; }
  get categoryId(): string | undefined { return this.props.categoryId; }
  get description(): string { return this.props.description; }
  get amount(): Money { return this.props.amount; }
  get source(): ExpenseSource { return this.props.source; }
  get status(): ExpenseStatus { return this.props.status; }
  get importHash(): ImportHash | undefined { return this.props.importHash; }
  get date(): Date { return this.props.date; }
  get month(): string { return this.props.month; }
  get year(): string { return this.props.year; }
  get assignments(): Assignment[] { return [...this.props.assignments]; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}

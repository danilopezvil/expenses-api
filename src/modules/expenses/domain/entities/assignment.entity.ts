import { Percentage } from '../value-objects/percentage.vo';
import { Result, ok, err } from '../../../../shared/result/result';
import { ValidationError } from '../../../../shared/errors/domain.errors';

export interface AssignmentProps {
  id: string;
  expenseId: string;
  memberId: string;
  percentage: Percentage;
}

export class Assignment {
  private constructor(private readonly props: AssignmentProps) {}

  static create(props: AssignmentProps): Result<Assignment, ValidationError> {
    if (!props.id?.trim()) {
      return err(new ValidationError('Assignment id is required'));
    }
    if (!props.expenseId?.trim()) {
      return err(new ValidationError('Assignment expenseId is required'));
    }
    if (!props.memberId?.trim()) {
      return err(new ValidationError('Assignment memberId is required'));
    }
    return ok(new Assignment(props));
  }

  get id(): string { return this.props.id; }
  get expenseId(): string { return this.props.expenseId; }
  get memberId(): string { return this.props.memberId; }
  get percentage(): Percentage { return this.props.percentage; }
}

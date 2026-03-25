import { ValueObject } from '../../../../shared/domain/value-object';
import { ValidationError } from '../../../../shared/errors/domain.errors';

export enum ExpenseCategoryEnum {
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  ACCOMMODATION = 'ACCOMMODATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
  HEALTH = 'HEALTH',
  UTILITIES = 'UTILITIES',
  SHOPPING = 'SHOPPING',
  OTHER = 'OTHER',
}

interface ExpenseCategoryProps {
  value: ExpenseCategoryEnum;
}

export class ExpenseCategory extends ValueObject<ExpenseCategoryProps> {
  private constructor(props: ExpenseCategoryProps) {
    super(props);
  }

  static create(value: string): ExpenseCategory {
    const upper = value.toUpperCase();
    if (!Object.values(ExpenseCategoryEnum).includes(upper as ExpenseCategoryEnum)) {
      throw new ValidationError(
        `Invalid category "${value}". Valid values: ${Object.values(ExpenseCategoryEnum).join(', ')}`,
      );
    }
    return new ExpenseCategory({ value: upper as ExpenseCategoryEnum });
  }

  static other(): ExpenseCategory {
    return new ExpenseCategory({ value: ExpenseCategoryEnum.OTHER });
  }

  get value(): ExpenseCategoryEnum {
    return this.props.value;
  }
}

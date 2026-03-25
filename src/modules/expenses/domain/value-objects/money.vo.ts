import { ValueObject } from '../../../../shared/domain/value-object';
import { ValidationError } from '../../../../shared/errors/domain.errors';

export class MoneyValidationError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyValidationError';
  }
}

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  static create(amount: number, currency: string): Money {
    if (isNaN(amount)) {
      throw new MoneyValidationError('Amount cannot be NaN');
    }
    if (!isFinite(amount)) {
      throw new MoneyValidationError('Amount cannot be Infinite');
    }
    if (amount < 0) {
      throw new MoneyValidationError('Amount cannot be negative');
    }
    const rounded = Math.round(amount * 100) / 100;
    if (Math.abs(rounded - amount) > 5e-10) {
      throw new MoneyValidationError('Amount cannot have more than 2 decimal places');
    }
    if (!currency || !currency.trim()) {
      throw new MoneyValidationError('Currency cannot be empty');
    }
    return new Money({ amount: rounded, currency: currency.toUpperCase() });
  }

  /** Internal factory that rounds before creating — used by add/multiply. */
  private static fromComputed(amount: number, currency: string): Money {
    return new Money({
      amount: Math.round(amount * 100) / 100,
      currency: currency.toUpperCase(),
    });
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new MoneyValidationError(
        `Cannot add ${this.currency} and ${other.currency}`,
      );
    }
    return Money.fromComputed(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    if (isNaN(factor) || !isFinite(factor)) {
      throw new MoneyValidationError('Factor must be a finite number');
    }
    return Money.fromComputed(this.amount * factor, this.currency);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  get formatted(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }
}

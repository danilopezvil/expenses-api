import { ValueObject } from '../../../../shared/domain/value-object';
import { ValidationError } from '../../../../shared/errors/domain.errors';

interface PercentageProps {
  value: number;
}

export class Percentage extends ValueObject<PercentageProps> {
  private constructor(props: PercentageProps) {
    super(props);
  }

  static create(value: number): Percentage {
    if (isNaN(value) || !isFinite(value)) {
      throw new ValidationError('Percentage must be a finite number');
    }
    if (value <= 0 || value > 100) {
      throw new ValidationError('Percentage must be > 0 and <= 100');
    }
    const rounded = Math.round(value * 100) / 100;
    if (Math.abs(rounded - value) > 5e-10) {
      throw new ValidationError('Percentage cannot have more than 2 decimal places');
    }
    return new Percentage({ value: rounded });
  }

  /** Returns true if the percentages sum is between 99.99 and 100.01 (float tolerance). */
  static validateSum(percentages: Percentage[]): boolean {
    const sum = percentages.reduce((acc, p) => acc + p.value, 0);
    return sum >= 99.99 && sum <= 100.01;
  }

  get value(): number {
    return this.props.value;
  }
}

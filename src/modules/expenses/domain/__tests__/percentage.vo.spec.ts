import { Percentage } from '../value-objects/percentage.vo';
import { ValidationError } from '../../../../shared/errors/domain.errors';

describe('Percentage', () => {
  it('creates a valid percentage', () => {
    const p = Percentage.create(33.33);
    expect(p.value).toBe(33.33);
  });

  it('throws for value = 0', () => {
    expect(() => Percentage.create(0)).toThrow(ValidationError);
  });

  it('throws for value > 100', () => {
    expect(() => Percentage.create(100.01)).toThrow(ValidationError);
    expect(() => Percentage.create(200)).toThrow(ValidationError);
  });

  it('allows exactly 100', () => {
    const p = Percentage.create(100);
    expect(p.value).toBe(100);
  });

  it('throws for more than 2 decimal places', () => {
    expect(() => Percentage.create(33.333)).toThrow(ValidationError);
  });

  it('validateSum returns true for an exact 100', () => {
    const ps = [Percentage.create(50), Percentage.create(50)];
    expect(Percentage.validateSum(ps)).toBe(true);
  });

  it('validateSum returns true within float tolerance (three-way split)', () => {
    // 33.33 + 33.33 + 33.34 = 100.00
    const ps = [
      Percentage.create(33.33),
      Percentage.create(33.33),
      Percentage.create(33.34),
    ];
    expect(Percentage.validateSum(ps)).toBe(true);
  });

  it('validateSum returns false when sum is clearly not 100', () => {
    const ps = [Percentage.create(40), Percentage.create(40)];
    expect(Percentage.validateSum(ps)).toBe(false);
  });
});

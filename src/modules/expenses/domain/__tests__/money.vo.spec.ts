import { Money, MoneyValidationError } from '../value-objects/money.vo';

describe('Money', () => {
  it('creates a valid Money instance', () => {
    const m = Money.create(45.80, 'USD');
    expect(m.amount).toBe(45.80);
    expect(m.currency).toBe('USD');
  });

  it('throws MoneyValidationError for NaN', () => {
    expect(() => Money.create(NaN, 'USD')).toThrow(MoneyValidationError);
    expect(() => Money.create(NaN, 'USD')).toThrow('NaN');
  });

  it('throws MoneyValidationError for Infinity', () => {
    expect(() => Money.create(Infinity, 'USD')).toThrow(MoneyValidationError);
    expect(() => Money.create(-Infinity, 'USD')).toThrow(MoneyValidationError);
  });

  it('throws MoneyValidationError for negative amount', () => {
    expect(() => Money.create(-0.01, 'USD')).toThrow(MoneyValidationError);
    expect(() => Money.create(-100, 'EUR')).toThrow(MoneyValidationError);
  });

  it('throws MoneyValidationError for more than 2 decimal places', () => {
    expect(() => Money.create(1.999, 'USD')).toThrow(MoneyValidationError);
    expect(() => Money.create(10.123, 'USD')).toThrow(MoneyValidationError);
  });

  it('add() returns the correct sum in the same currency', () => {
    const a = Money.create(10.50, 'USD');
    const b = Money.create(4.75, 'USD');
    const result = a.add(b);
    expect(result.amount).toBe(15.25);
    expect(result.currency).toBe('USD');
  });

  it('add() throws when currencies differ', () => {
    const usd = Money.create(10, 'USD');
    const eur = Money.create(10, 'EUR');
    expect(() => usd.add(eur)).toThrow(MoneyValidationError);
  });

  it('multiply() scales the amount correctly', () => {
    const m = Money.create(100, 'USD');
    const result = m.multiply(0.25);
    expect(result.amount).toBe(25);
    expect(result.currency).toBe('USD');
  });

  it('multiply() rounds to 2 decimal places', () => {
    const m = Money.create(10, 'USD');
    // 10 * 0.333 = 3.33 after rounding
    const result = m.multiply(0.333);
    expect(result.amount).toBe(3.33);
  });

  it('formatted getter returns "amount.toFixed(2) CURRENCY"', () => {
    expect(Money.create(45.8, 'USD').formatted).toBe('45.80 USD');
    expect(Money.create(100, 'EUR').formatted).toBe('100.00 EUR');
    expect(Money.create(0, 'USD').formatted).toBe('0.00 USD');
  });
});

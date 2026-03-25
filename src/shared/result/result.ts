import { DomainError } from '../errors/domain.errors';

class Ok<T> {
  readonly _tag = 'ok' as const;

  constructor(readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): this is Err<never> {
    return false;
  }

  map<U>(fn: (v: T) => U): Ok<U> {
    return ok(fn(this.value));
  }

  getOrThrow(): T {
    return this.value;
  }
}

class Err<E> {
  readonly _tag = 'err' as const;

  constructor(readonly error: E) {}

  isOk(): this is Ok<never> {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }

  map<U>(_fn: unknown): Err<E> {
    return this;
  }

  getOrThrow(): never {
    throw this.error;
  }
}

export type Result<T, E = DomainError> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => new Ok(value);
export const err = <E>(error: E): Err<E> => new Err(error);

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 'INTERNAL_ERROR');
  }
}

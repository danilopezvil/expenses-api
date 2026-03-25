import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from './domain.errors';
import { UnauthorizedError } from './app.errors';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, code } = this.resolveException(exception);

    if (status >= 500) {
      this.logger.error(exception);
    }

    const body: ErrorResponse = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private resolveException(exception: unknown): { status: number; message: string; code: string } {
    if (exception instanceof NotFoundError) {
      return { status: HttpStatus.NOT_FOUND, message: exception.message, code: exception.code };
    }
    if (exception instanceof ValidationError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
        code: exception.code,
      };
    }
    if (exception instanceof ConflictError) {
      return { status: HttpStatus.CONFLICT, message: exception.message, code: exception.code };
    }
    if (exception instanceof ForbiddenError) {
      return { status: HttpStatus.FORBIDDEN, message: exception.message, code: exception.code };
    }
    if (exception instanceof UnauthorizedError) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: exception.message,
        code: exception.code,
      };
    }
    if (exception instanceof DomainError) {
      return { status: HttpStatus.BAD_REQUEST, message: exception.message, code: exception.code };
    }
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as Record<string, unknown>).message?.toString() ?? exception.message);
      return { status: exception.getStatus(), message, code: 'HTTP_ERROR' };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorResponseBody {
  /** Machine-readable error code. */
  code?: string;
  /** Validation details keyed by input field. */
  issues?: {
    fieldErrors?: Record<string, string[]>;
  };
  /** Human-readable error message. */
  message?: string | string[];
  /** Default Nest status string. */
  error?: string;
}

/**
 * Normalizes all thrown exceptions into a compact JSON shape accepted by the
 * frontend REST error normalizer.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Serializes known HTTP exceptions and hides unexpected implementation errors.
   *
   * @param exception - Thrown exception from the request pipeline.
   * @param host - Nest execution context.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = this.toResponseBody(exception);

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
    }

    response.status(status).json(body);
  }

  /**
   * Builds the public response body for a thrown exception.
   *
   * @param exception - Thrown exception from the request pipeline.
   * @returns JSON-safe error response.
   */
  private toResponseBody(exception: unknown): Required<Pick<ErrorResponseBody, 'message'>> &
    Omit<ErrorResponseBody, 'message'> {
    if (!(exception instanceof HttpException)) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
      };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        message: response,
      };
    }

    const body = response as ErrorResponseBody;
    const message = Array.isArray(body.message)
      ? body.message.join(' ')
      : body.message ?? body.error ?? exception.message;

    return {
      code: body.code,
      issues: body.issues,
      message,
    };
  }
}

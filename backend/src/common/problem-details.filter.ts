import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  /** Field-level validation messages, keyed by property name. */
  errors?: Record<string, string[]>;
  instance?: string;
}

/**
 * Translates every thrown error into an RFC 7807-style ProblemDetails body so the
 * frontend can render *why* a request failed (per-field `errors` + `detail`),
 * never a bare "something went wrong". class-validator messages from the global
 * ValidationPipe are folded into `errors`.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const problem: ProblemDetails = {
      type: 'about:blank',
      title: this.titleFor(status),
      status,
      instance: req.url,
    };

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        problem.detail = response;
      } else if (typeof response === 'object' && response !== null) {
        const body = response as Record<string, unknown>;
        const message = body.message;
        if (Array.isArray(message)) {
          problem.errors = this.foldValidationMessages(message as string[]);
          problem.detail = 'One or more fields are invalid.';
        } else if (typeof message === 'string') {
          problem.detail = message;
        }
        if (typeof body.error === 'string' && !problem.detail) {
          problem.detail = body.error;
        }
      }
    } else {
      problem.detail = 'An unexpected error occurred.';
      this.logger.error(
        `Unhandled exception on ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json(problem);
  }

  /** class-validator emits "field message" strings; group them by field. */
  private foldValidationMessages(messages: string[]): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    for (const msg of messages) {
      const field = msg.split(' ')[0];
      (errors[field] ??= []).push(msg);
    }
    return errors;
  }

  private titleFor(status: number): string {
    return (
      {
        [HttpStatus.BAD_REQUEST]: 'Validation failed',
        [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
        [HttpStatus.FORBIDDEN]: 'Forbidden',
        [HttpStatus.NOT_FOUND]: 'Not found',
        [HttpStatus.CONFLICT]: 'Conflict',
        [HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload too large',
        [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
      }[status] ?? 'Server error'
    );
  }
}

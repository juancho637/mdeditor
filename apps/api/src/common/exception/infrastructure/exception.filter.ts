import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let codeError = 'SYS001';
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        codeError = (resp.code_error as string) || codeError;
        message = (resp.message as string) || exception.message;
      } else {
        message = exception.message;
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR && !(exception instanceof HttpException)) {
      console.error(
        `[${codeError}] Unhandled exception`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(status).json({
      code_error: codeError,
      message,
      path: request.url,
      request_id: request['requestId'] || 'unknown',
      method: request.method,
    });
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ValidationFilter');

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request['requestId'] || 'unknown';
    const exceptionResponse = exception.getResponse() as Record<string, unknown>;

    // class-validator errors: message is string[]
    if (Array.isArray(exceptionResponse.message)) {
      const validationErrors = exceptionResponse.message as string[];

      this.logger.warn(
        JSON.stringify({
          event: 'validation_error',
          requestId,
          path: request.url,
          method: request.method,
          errors: validationErrors,
        }),
      );

      response.status(HttpStatus.BAD_REQUEST).json({
        code_error: 'VAL001',
        message: validationErrors,
        path: request.url,
        request_id: requestId,
        method: request.method,
      });
      return;
    }

    // Business logic BadRequestExceptions (AUT001, AUT003, etc.)
    const codeError = (exceptionResponse.code_error as string) || 'SYS001';
    const message = (exceptionResponse.message as string) || exception.message;

    this.logger.error(
      JSON.stringify({
        requestId,
        statusCode: HttpStatus.BAD_REQUEST,
        path: request.url,
        method: request.method,
        codeError,
        message,
      }),
    );

    response.status(HttpStatus.BAD_REQUEST).json({
      code_error: codeError,
      message,
      path: request.url,
      request_id: requestId,
      method: request.method,
    });
  }
}

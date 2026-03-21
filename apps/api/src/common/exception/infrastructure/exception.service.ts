import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
  Logger,
} from '@nestjs/common';
import {
  ExceptionServiceInterface,
  FormatExceptionMessageInterface,
} from '../domain';

@Injectable()
export class ExceptionService implements ExceptionServiceInterface {
  private readonly logger = new Logger('ExceptionService');

  badRequestException({ message, context, error }: FormatExceptionMessageInterface): Error {
    if (error instanceof HttpException) return error;
    this.logger.error(`[${message.codeError}] ${message.serverMessage}`, context);
    return new BadRequestException({ code_error: message.codeError, message: message.message });
  }

  unauthorizedException({ message, context, error }: FormatExceptionMessageInterface): Error {
    if (error instanceof HttpException) return error;
    this.logger.error(`[${message.codeError}] ${message.serverMessage}`, context);
    return new UnauthorizedException({ code_error: message.codeError, message: message.message });
  }

  forbiddenException({ message, context, error }: FormatExceptionMessageInterface): Error {
    if (error instanceof HttpException) return error;
    this.logger.error(`[${message.codeError}] ${message.serverMessage}`, context);
    return new ForbiddenException({ code_error: message.codeError, message: message.message });
  }

  notFoundException({ message, context, error }: FormatExceptionMessageInterface): Error {
    if (error instanceof HttpException) return error;
    this.logger.error(`[${message.codeError}] ${message.serverMessage}`, context);
    return new NotFoundException({ code_error: message.codeError, message: message.message });
  }

  conflictException({ message, context, error }: FormatExceptionMessageInterface): Error {
    if (error instanceof HttpException) return error;
    this.logger.error(`[${message.codeError}] ${message.serverMessage}`, context);
    return new ConflictException({ code_error: message.codeError, message: message.message });
  }

  internalServerErrorException({ message, context, error }: FormatExceptionMessageInterface): Error {
    if (error instanceof HttpException) return error;
    this.logger.error(
      `[${message.codeError}] ${message.serverMessage}`,
      error instanceof Error ? error.stack : undefined,
      context,
    );
    return new InternalServerErrorException({ code_error: message.codeError, message: message.message });
  }
}

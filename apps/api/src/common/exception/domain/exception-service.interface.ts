import { FormatExceptionMessageInterface } from './format-exception-message.interface';

export interface ExceptionServiceInterface {
  badRequestException(data: FormatExceptionMessageInterface): Error;
  unauthorizedException(data: FormatExceptionMessageInterface): Error;
  forbiddenException(data: FormatExceptionMessageInterface): Error;
  notFoundException(data: FormatExceptionMessageInterface): Error;
  conflictException(data: FormatExceptionMessageInterface): Error;
  internalServerErrorException(data: FormatExceptionMessageInterface): Error;
}

import { BaseError, type BaseErrorParams } from './base-error'

export class BadRequestError extends BaseError {
  constructor({ status, code, message }: BaseErrorParams = {}) {
    super({
      status: status || 400,
      code: code || 'BAD_REQUEST',
      message: message || 'Bad request',
    })
  }
}

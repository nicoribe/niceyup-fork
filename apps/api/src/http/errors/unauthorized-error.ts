import { BaseError, type BaseErrorParams } from './base-error'

export class UnauthorizedError extends BaseError {
  constructor({ code, message }: Omit<BaseErrorParams, 'status'> = {}) {
    super({
      code: code || 'unauthorized',
      message: message || 'Unauthorized',
    })
  }
}

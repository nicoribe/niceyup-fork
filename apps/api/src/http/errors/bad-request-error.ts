import { ErrorRequest, type ErrorRequestParams } from './error-request'

export class BadRequestError extends ErrorRequest {
  constructor({ status, code, message }: ErrorRequestParams = {}) {
    super({
      status: status || 400,
      code: code || 'bad-request',
      message: message || 'Bad request.',
    })
  }
}

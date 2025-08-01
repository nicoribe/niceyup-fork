export type BaseErrorParams = {
  status?: number
  code?: string
  message?: string
}

export class BaseError extends Error {
  constructor({ status, code, message }: BaseErrorParams = {}) {
    super(JSON.stringify({ status, code, message }))
  }
}

export type ErrorRequestParams = {
  status?: number
  code?: string
  message?: string
}

export class ErrorRequest extends Error {
  constructor({ status, code, message }: ErrorRequestParams = {}) {
    super(JSON.stringify({ status, code, message }))
  }
}

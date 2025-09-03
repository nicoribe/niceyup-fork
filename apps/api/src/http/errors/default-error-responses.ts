import { z } from 'zod'

export const BadRequestResponse = {
  400: z
    .object({
      code: z.string(),
      message: z.string(),
      errors: z
        .array(
          z
            .object({
              code: z.string(),
              message: z.string(),
              path: z.array(z.string().or(z.number())),
            })
            .and(z.record(z.string(), z.unknown())),
        )
        .optional()
        .describe('Validation errors'),
    })
    .describe(
      'Bad Request. Usually due to missing parameters, or invalid parameters.',
    ),
}

export const UnauthorizedResponse = {
  401: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .describe('Unauthorized. Due to missing or invalid authentication.'),
}

export const ForbiddenResponse = {
  403: z
    .object({
      message: z.string(),
    })
    .describe(
      'Forbidden. You do not have permission to access this resource or to perform this action.',
    ),
}

export const NotFoundResponse = {
  404: z
    .object({
      message: z.string(),
    })
    .describe('Not Found. The requested resource was not found.'),
}

export const TooManyRequestsResponse = {
  429: z
    .object({
      message: z.string(),
    })
    .describe(
      'Too Many Requests. You have exceeded the rate limit. Try again later.',
    ),
}

export const InternalServerErrorResponse = {
  500: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .describe(
      'Internal Server Error. This is a problem with the server that you cannot fix.',
    ),
}

export function withDefaultErrorResponses<
  T extends Record<number, z.ZodTypeAny>,
>(response: T) {
  return {
    ...BadRequestResponse,
    ...UnauthorizedResponse,
    ...ForbiddenResponse,
    ...NotFoundResponse,
    ...TooManyRequestsResponse,
    ...InternalServerErrorResponse,
    ...response,
  }
}

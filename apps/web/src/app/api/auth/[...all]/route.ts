import { auth, toNextJsHandler } from '@workspace/auth'

export const { POST, GET } = toNextJsHandler(auth)

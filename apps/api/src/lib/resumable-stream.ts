import { cache } from '@workspace/cache'
import { createResumableStreamContext } from '@workspace/realtime'

export const resumableStreamContext = createResumableStreamContext({
  waitUntil: null,
  subscriber: cache.duplicate(),
  publisher: cache,
})

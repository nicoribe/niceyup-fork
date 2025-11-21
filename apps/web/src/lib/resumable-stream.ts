import { cache } from '@workspace/cache'
import { createResumableStreamContext } from '@workspace/realtime'
import { after } from 'next/server'

export const resumableStreamContext = createResumableStreamContext({
  waitUntil: after,
  subscriber: cache.duplicate(),
  publisher: cache,
})

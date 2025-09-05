import { env } from '@workspace/env'
import { app } from './app'

const host = '0.0.0.0'
const port = env.PORT || 3333

app.listen({ host, port }).then(() => {
  console.log(`HTTP server running on '${host}:${port}'`)
})

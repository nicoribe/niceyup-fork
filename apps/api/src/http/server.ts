import { env } from '@workspace/env'
import { app } from './app'

app.listen({ port: env.PORT || 3333 }).then(() => {
  console.log('HTTP server running!')
})

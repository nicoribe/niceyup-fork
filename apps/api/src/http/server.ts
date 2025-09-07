import { env } from '@/lib/env'
import { app } from './app'

app.listen({ host: '0.0.0.0', port: env.PORT || 3333 }).then(() => {
  console.log('HTTP server running!')
})

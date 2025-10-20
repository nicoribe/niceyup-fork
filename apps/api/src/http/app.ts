import { env } from '@/lib/env'
import { fastifyCors } from '@fastify/cors'
import { fastifyMultipart } from '@fastify/multipart'
import { fastifyRedis } from '@fastify/redis'
import { fastifySwagger } from '@fastify/swagger'
import { fastifyWebsocket } from '@fastify/websocket'
import fastifyScalar from '@scalar/fastify-api-reference'
import { cache } from '@workspace/cache'
import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { version } from '../../package.json'
import { errorHandler, errorHandlerWebsocket } from './errors/error-handler'
import { fastifyRealtime } from './realtime'
import { routes } from './routes'

export const app = fastify({
  // logger: {
  //   transport: {
  //     target: 'pino-pretty',
  //     options: {
  //       translateTime: 'HH:MM:ss Z',
  //       ignore: 'pid,hostname',
  //     },
  //   },
  // },
}).withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifyCors)

app.register(fastifyRedis, {
  client: cache,
})

app.register(fastifyWebsocket, {
  errorHandler: errorHandlerWebsocket,
})

app.register(fastifyMultipart, {
  // attachFieldsToBody: true,
})

if (env.APP_ENV === 'development') {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Niceyup',
        description: 'API Reference for Niceyup',
        version,
      },
      components: {
        securitySchemes: {
          apiKeyCookie: {
            type: 'apiKey',
            in: 'cookie',
            name: 'apiKeyCookie',
            description: 'API Key authentication via cookie',
          },
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            description: 'Bearer token authentication',
          },
        },
      },
      security: [{ apiKeyCookie: [], bearerAuth: [] }],
      servers: [{ url: `${env.API_URL}/api` }],
    },
    transform: jsonSchemaTransform,
  })

  app.register(fastifyScalar, {
    routePrefix: '/api/docs',
    configuration: {
      pageTitle: 'Niceyup API',
      favicon: `${env.WEB_URL}/logo-light.png`,
      theme: 'saturn',
    },
  })
}

app.register(fastifyRealtime)

app.register(routes, { prefix: '/api' })

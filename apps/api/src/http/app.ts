import { env } from '@/lib/env'
import { fastifyCors } from '@fastify/cors'
import { fastifyMultipart } from '@fastify/multipart'
import { fastifySwagger } from '@fastify/swagger'
import fastifyScalar from '@scalar/fastify-api-reference'
import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { version } from '../../package.json'
import { errorHandler } from './errors/error-handler'
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
app.register(fastifyMultipart, {
  // attachFieldsToBody: true,
})

if (env.APP_ENV === 'development') {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Better Chat',
        description: 'API Reference for Better Chat',
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
      pageTitle: 'Better Chat API',
      favicon: `${env.WEB_URL}/logo-light.svg`,
      theme: 'saturn',
    },
  })
}

app.register(routes, { prefix: '/api' })

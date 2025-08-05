import { BadRequestError } from '@/http/errors/bad-request-error'
import type { FastifyTypedInstance } from '@/types/fastify'
import { auth, fromNodeHeaders } from '@workspace/auth'
import { fastifyPlugin } from 'fastify-plugin'

export const verifyOrganizationSubscription = fastifyPlugin(
  async (app: FastifyTypedInstance) => {
    app.addHook('preHandler', async (request) => {
      const { session } = request.authSession

      const organizationId = session.activeOrganizationId

      if (organizationId) {
        const subscriptions = await auth.api.listActiveSubscriptions({
          query: {
            referenceId: organizationId,
          },
          headers: fromNodeHeaders(request.headers),
        })

        const activeSubscription = subscriptions.find(
          ({ status }) => status === 'active' || status === 'trialing',
        )

        if (!activeSubscription) {
          throw new BadRequestError({
            code: 'organization_subscription_not_active',
            message: 'Organization subscription is not active',
          })
        }
      }
    })
  },
)

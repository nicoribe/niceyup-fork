import { checkout, polar, portal, usage, webhooks } from '@polar-sh/better-auth'
import { billing } from '..'
import { env } from './env'
import { plans } from './plans'

export function polarPlugin() {
  return polar({
    client: billing,
    createCustomerOnSignUp: true,
    use: [
      checkout({
        products: Object.values(plans),
        successUrl: '/billing/success?checkout_id={CHECKOUT_ID}',
        returnUrl: '/billing/plans',
        authenticatedUsersOnly: true,
      }),
      portal({
        returnUrl: `${env.WEB_URL}/account/settings/billing`,
      }),
      usage(),
      webhooks({
        secret: env.POLAR_WEBHOOK_SECRET,
      }),
    ],
  })
}

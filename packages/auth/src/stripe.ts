import { stripe as stripePlugin } from '@better-auth/stripe'
import type { StripePlan } from '@better-auth/stripe'
import { env } from '@workspace/env'
import { Stripe } from 'stripe'

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
})

const stripePlans: StripePlan[] = [
  {
    name: 'Standard',
    priceId: env.STRIPE_STANDARD_PLAN_PRICE_ID,
    annualDiscountPriceId: env.STRIPE_STANDARD_PLAN_ANNUAL_DISCOUNT_PRICE_ID,
    freeTrial: {
      days: env.STRIPE_STANDARD_PLAN_FREE_TRIAL_DAYS,
    },
  },
  {
    name: 'Pro',
    priceId: env.STRIPE_PRO_PLAN_PRICE_ID,
    annualDiscountPriceId: env.STRIPE_PRO_PLAN_ANNUAL_DISCOUNT_PRICE_ID,
  },
]

export function stripe() {
  return stripePlugin({
    stripeClient,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    createCustomerOnSignUp: true,
    subscription: {
      enabled: true,
      plans: stripePlans,
      // requireEmailVerification: true,
      // organization: {
      //   enabled: true,
      // }
    },
  })
}

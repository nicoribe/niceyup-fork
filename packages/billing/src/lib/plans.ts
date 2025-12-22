import { env } from './env'

export const plans = {
  // hobby: {
  //   slug: 'hobby',
  //   name: 'Hobby',
  //   productId: env.POLAR_HOBBY_PLAN_PRODUCT_ID,
  // },
  standard: {
    slug: 'standard',
    name: 'Standard',
    productId: env.POLAR_STANDARD_PLAN_PRODUCT_ID,
  },
  // pro: {
  //   slug: 'pro',
  //   name: 'Pro',
  //   productId: env.POLAR_PRO_PLAN_PRODUCT_ID,
  // },
} as const

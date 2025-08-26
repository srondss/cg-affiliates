import Stripe from 'stripe'
import { httpAction } from './_generated/server'
import { httpRouter } from 'convex/server'

const http = httpRouter()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

async function getStripeEvent(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error(`Stripe - Environment variables not initialized`)
  }

  try {
    const signature = request.headers.get('Stripe-Signature')
    if (!signature) throw new Error('Stripe - Missing signature')
    const payload = await request.text()
    const event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    return event
  } catch (err: unknown) {
    console.log(err)
    throw new Error('Something went wrong')
  }
}

http.route({
  path: '/stripe/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const event = await getStripeEvent(request)
    console.log('received stripe event', event)

    // eslint-disable-next-line no-useless-catch
    try {
      switch (event.type) {
        /**
         * Occurs when a Checkout Session has been successfully completed.
         */
        case 'checkout.session.completed': {
          console.log('checkout.session.completed', event)
          break
        }

        case 'account.application.authorized': {
          console.log('account.application.authorized', event)
          break
        }

        case 'account.application.deauthorized': {
          console.log('account.application.deauthorized', event)
          break
        }
      }
    } catch (err: unknown) {
      throw err
    }

    return new Response(null)
  }),
})

export default http

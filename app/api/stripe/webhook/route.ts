import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { grant, PACKS } from '@/lib/credits'
import { newRandomToken } from '@/lib/identity'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

const CLAIM_TTL_HOURS = 24 * 30

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return NextResponse.json({ error: 'Bad signature' }, { status: 400 })

  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret)
  } catch (err) {
    console.error('[stripe webhook] invalid signature', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const deviceId = session.metadata?.device_id
  const packId = session.metadata?.pack
  const email = session.customer_details?.email ?? session.customer_email ?? null
  const pack = packId ? PACKS[packId] : null

  if (!deviceId || !pack) {
    console.error('[stripe webhook] missing metadata', { deviceId, packId })
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  try {
    const { granted } = await grant({
      deviceId,
      credits: pack.credits,
      stripeSession: session.id,
      email,
    })

    if (granted && email) {
      const token = newRandomToken()
      const expiresAt = new Date(Date.now() + CLAIM_TTL_HOURS * 60 * 60 * 1000).toISOString()
      const { error } = await supabase.from('credit_claim_tokens').insert({
        token,
        email,
        source_device: deviceId,
        expires_at: expiresAt,
      })
      if (error) console.error('[stripe webhook] claim token insert', error)

      const appUrl = process.env.APP_URL ?? new URL(req.url).origin
      const url = `${appUrl}/api/credits/claim?token=${encodeURIComponent(token)}`
      await sendEmail({
        to: email,
        subject: `Your ${pack.label} are ready`,
        html: `
          <p>Thanks for your purchase! ${pack.credits} story credits are now on your device.</p>
          <p>If you switch browsers or devices, click this link from the new device to move your credits over:</p>
          <p><a href="${url}">Restore my credits</a></p>
          <p style="color:#888;font-size:12px">Link expires in 30 days. One-time use.</p>
        `,
      })
    }

    return NextResponse.json({ received: true, granted })
  } catch (err) {
    console.error('[stripe webhook] handler error', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
}

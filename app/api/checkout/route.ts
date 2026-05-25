import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getOrSetDeviceId } from '@/lib/identity'
import { PACKS } from '@/lib/credits'
import { appUrl as resolveAppUrl } from '@/lib/app-url'

export async function POST(req: NextRequest) {
  try {
    const { pack } = (await req.json()) as { pack?: string }
    const def = pack ? PACKS[pack] : null
    if (!def) return NextResponse.json({ error: 'Unknown pack' }, { status: 400 })

    const priceId = process.env[def.priceEnv]
    if (!priceId) return NextResponse.json({ error: `${def.priceEnv} not configured` }, { status: 500 })

    const { deviceId } = await getOrSetDeviceId()
    const appUrl = resolveAppUrl(req)

    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: deviceId,
      metadata: { device_id: deviceId, pack: pack as string },
      success_url: `${appUrl}/wizard?paid=1`,
      cancel_url: `${appUrl}/wizard?canceled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[POST /api/checkout]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

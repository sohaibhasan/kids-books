import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getOrSetDeviceId } from '@/lib/identity'
import { PACKS } from '@/lib/credits'
import { appUrl as resolveAppUrl } from '@/lib/app-url'
import { apiError, apiOk } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const { pack } = (await req.json()) as { pack?: string }
    const def = pack ? PACKS[pack] : null
    if (!def) return apiError(400, 'VALIDATION_ERROR', 'Unknown pack')

    const priceId = process.env[def.priceEnv]
    if (!priceId) return apiError(500, 'SERVER_ERROR', `${def.priceEnv} not configured`)

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

    return apiOk({ url: session.url })
  } catch (err) {
    console.error('[POST /api/checkout]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return apiError(500, 'SERVER_ERROR', message)
  }
}

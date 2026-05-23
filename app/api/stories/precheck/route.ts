import { NextRequest, NextResponse } from 'next/server'
import { makeSlug } from '@/lib/utils/slug'
import { getOrSetDeviceId, getFallbackHash } from '@/lib/identity'
import { getEntitlement, isGloballyThrottled, PACKS } from '@/lib/credits'
import { WizardFormData } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const form: WizardFormData = await req.json()

    if (!form.child_name?.trim()) {
      return NextResponse.json({ error: 'child_name is required' }, { status: 400 })
    }

    const { deviceId } = await getOrSetDeviceId()
    const fallbackHash = await getFallbackHash()
    const entitlement = await getEntitlement(deviceId, fallbackHash)

    if (entitlement.kind === 'none') {
      return NextResponse.json(
        {
          paywall: true,
          packs: Object.entries(PACKS).map(([id, p]) => ({
            id,
            credits: p.credits,
            label: p.label,
            price: p.price,
          })),
        },
        { status: 402 },
      )
    }

    if (entitlement.kind === 'free' && (await isGloballyThrottled())) {
      return NextResponse.json(
        { error: 'Free tier is temporarily at capacity. Please try again later.' },
        { status: 503 },
      )
    }

    return NextResponse.json({ slug: makeSlug(form.child_name) })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

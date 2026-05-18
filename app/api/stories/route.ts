import { NextRequest, NextResponse } from 'next/server'
import { generateStory } from '@/lib/ai/generate-story'
import { makeSlug } from '@/lib/utils/slug'
import { supabase } from '@/lib/supabase'
import { getOrSetDeviceId, getFallbackHash } from '@/lib/identity'
import { getEntitlement, consumeOne, isGloballyThrottled, PACKS } from '@/lib/credits'
import { maybeAlertProviderQuota } from '@/lib/alerts'
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

    const story = await generateStory(form)
    const slug  = makeSlug(form.child_name)

    const creditEventId = await consumeOne(deviceId, entitlement.kind, slug)

    const { error } = await supabase.from('stories').insert({
      slug,
      title: story.title,
      form,
      pages: story.pages,
      images_done: false,
      device_id: deviceId,
      fallback_hash: fallbackHash,
      credit_event_id: creditEventId,
    })

    if (error) throw error

    return NextResponse.json({ slug, title: story.title })
  } catch (err) {
    console.error('[POST /api/stories]', err)
    void maybeAlertProviderQuota(err, 'POST /api/stories (Claude story-gen)')
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : (() => {
            try { return JSON.stringify(err) } catch { return 'Unknown error' }
          })()
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

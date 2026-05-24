import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { refundFailedGen } from '@/lib/credits'

/**
 * Called by the generating page when the cross-run retry budget is exhausted
 * and we cannot deliver a complete story. Refunds the credit (idempotent) and
 * acknowledges. The client then renders the terminal "refunded" state.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: story, error } = await supabase
    .from('stories')
    .select('images_done, credit_event_id, device_id')
    .eq('slug', slug)
    .single()

  if (error || !story) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (story.images_done) {
    return NextResponse.json(
      { error: 'already_complete' },
      { status: 409 },
    )
  }

  if (!story.credit_event_id || !story.device_id) {
    // Free-tier attempt that couldn't be completed — nothing to refund.
    return NextResponse.json({ refunded: false, reason: 'free_tier' })
  }

  try {
    const { refunded } = await refundFailedGen(story.device_id as string, slug)
    return NextResponse.json({ refunded })
  } catch (err) {
    console.error(`[abandon ${slug}] refund failed`, err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

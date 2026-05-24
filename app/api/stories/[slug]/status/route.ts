import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Lightweight status check for the generating page. When the SSE stream
 * drops mid-flight (idle proxy timeout, network hiccup), the client calls
 * this to decide whether to navigate to /read/[slug] or retry the stream.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data, error } = await supabase
    .from('stories')
    .select('images_done, pages')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const pages = typeof data.pages === 'string' ? JSON.parse(data.pages) : data.pages
  const total = Array.isArray(pages) ? pages.length : 0

  const { data: refundRow } = await supabase
    .from('credit_events')
    .select('id')
    .eq('story_slug', slug)
    .eq('reason', 'refund_failed_gen')
    .maybeSingle()

  return NextResponse.json({
    images_done: Boolean(data.images_done),
    total_pages: total,
    refunded: !!refundRow,
  })
}

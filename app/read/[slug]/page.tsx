import { notFound, redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StoryReader from '@/components/reader/StoryReader'
import { parsePagesLenient } from '@/lib/validation'
import { getDeviceIdIfPresent } from '@/lib/identity'
import type { PageStatus } from '@/lib/jobs/claim'

export const dynamic = 'force-dynamic'

const BUCKET = 'story-images'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await supabase.from('stories').select('title').eq('slug', slug).single()
  return { title: data ? `${data.title} — Storybook Studio` : 'Story Not Found' }
}

export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Note: regens_remaining is intentionally NOT in this select. If migration
  // 0009 hasn't been applied, selecting it would error and 404 the reader for
  // everyone; instead it's fetched separately below (owner-only, best-effort).
  const { data: story, error } = await supabase
    .from('stories')
    .select('title, pages, form, images_done, device_id, page_status')
    .eq('slug', slug)
    .single()

  if (error || !story) notFound()

  // Never serve a partial story — bounce back to the generating page where
  // the retry pipeline will either finish it or refund + inform the user.
  if (!story.images_done) redirect(`/generating/${slug}`)

  // Owner check is read-only (no cookie mutation during render).
  const viewerDeviceId = await getDeviceIdIfPresent()
  const isOwner = Boolean(viewerDeviceId && story.device_id && viewerDeviceId === story.device_id)

  // Only owners see (and can spend) the regen budget. Fetched separately so a
  // missing regens_remaining column degrades to "no button", never a 500.
  let regensRemaining = 0
  if (isOwner) {
    const { data: budget } = await supabase
      .from('stories')
      .select('regens_remaining')
      .eq('slug', slug)
      .maybeSingle()
    regensRemaining = (budget?.regens_remaining as number | undefined) ?? 0
  }

  // Cache-busting: Supabase CDN + the browser cache the public URL, so a
  // regenerated image would otherwise never appear on a future load. When a
  // page's page_status carries an image_version (set by the regenerate
  // endpoint), append it as ?v=<version> to force a fresh fetch.
  const psByNum = new Map<number, PageStatus>()
  const psArr: PageStatus[] = Array.isArray(story.page_status) ? story.page_status : []
  for (const ps of psArr) psByNum.set(ps.page_number, ps)

  const pages = parsePagesLenient(story.pages).map(p => {
    const filename = `${slug}/page-${String(p.page_number).padStart(2, '0')}.png`
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    const version = psByNum.get(p.page_number)?.image_version
    const illustration_url = version ? `${data.publicUrl}?v=${version}` : data.publicUrl
    return { ...p, illustration_url }
  })

  return (
    <StoryReader
      title={story.title}
      pages={pages}
      slug={slug}
      isOwner={isOwner}
      regensRemaining={regensRemaining}
    />
  )
}

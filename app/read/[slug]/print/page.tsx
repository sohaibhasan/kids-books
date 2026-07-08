import { notFound, redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { parsePagesLenient } from '@/lib/validation'
import type { PageStatus } from '@/lib/jobs/claim'
import AutoPrint from './AutoPrint'
import './print.css'

export const dynamic = 'force-dynamic'

const BUCKET = 'story-images'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await supabase.from('stories').select('title').eq('slug', slug).single()
  return { title: data ? `${data.title} — Print Preview` : 'Print Preview' }
}

export default async function PrintPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Same query shape as app/read/[slug]/page.tsx — intentionally mirrored so
  // the two routes always produce the same URLs for the same story state.
  const { data: story, error } = await supabase
    .from('stories')
    .select('title, pages, form, images_done, page_status')
    .eq('slug', slug)
    .single()

  if (error || !story) notFound()

  // Bounce back to the generating page exactly like the read route does.
  if (!story.images_done) redirect(`/generating/${slug}`)

  // Cache-buster: mirror the exact logic from app/read/[slug]/page.tsx so a
  // regenerated image shows its fresh version here too.
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
    /*
     * bg-white / text-black: print never uses the dark reader theme.
     * The print.css @page rule handles margins; @media print overrides take
     * over from the Tailwind screen utilities below.
     */
    <div className="bg-white text-black font-sans">
      {/* Sticky screen-only bar with auto-print logic and a manual fallback */}
      <AutoPrint />

      <div className="max-w-3xl mx-auto px-8">
        {pages.map(page => (
          <div
            key={page.page_number}
            className="print-page flex flex-col items-center py-12"
          >
            {/* Cover page: show the title above the image */}
            {page.type === 'cover' && (
              <h1 className="font-display text-4xl font-bold text-center mb-8 text-black">
                {story.title}
              </h1>
            )}

            {/* Illustration — plain eager <img> on purpose: next/image lazy
                loading and viewport-based sizing actively hurt print output. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.illustration_url}
              alt={
                page.type === 'cover'
                  ? `Cover illustration for ${story.title}`
                  : page.type === 'end'
                  ? 'The End'
                  : `Illustration for page ${page.page_number}`
              }
              loading="eager"
              /*
               * print-img: capped at 5.5 in tall in @media print (see print.css).
               * On screen: full width up to the container, reasonable height cap.
               */
              className="print-img w-full max-h-[70vh] object-contain rounded-lg"
            />

            {/* Text content for story pages and the end page */}
            {page.type !== 'cover' && page.text_content && (
              <p className="mt-8 text-lg leading-relaxed text-center text-black max-w-2xl">
                {page.text_content}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

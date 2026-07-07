import { notFound, redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StoryReader from '@/components/reader/StoryReader'
import { parsePagesLenient } from '@/lib/validation'

export const dynamic = 'force-dynamic'

const BUCKET = 'story-images'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await supabase.from('stories').select('title').eq('slug', slug).single()
  return { title: data ? `${data.title} — Storybook Studio` : 'Story Not Found' }
}

export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: story, error } = await supabase
    .from('stories')
    .select('title, pages, form, images_done')
    .eq('slug', slug)
    .single()

  if (error || !story) notFound()

  // Never serve a partial story — bounce back to the generating page where
  // the retry pipeline will either finish it or refund + inform the user.
  if (!story.images_done) redirect(`/generating/${slug}`)

  const pages = parsePagesLenient(story.pages).map(p => {
    const filename = `${slug}/page-${String(p.page_number).padStart(2, '0')}.png`
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    return { ...p, illustration_url: data.publicUrl }
  })

  return <StoryReader title={story.title} pages={pages} slug={slug} />
}

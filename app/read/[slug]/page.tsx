import { notFound, redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StoryReader from '@/components/reader/StoryReader'

export const dynamic = 'force-dynamic'

const BUCKET = 'story-images'

interface StoryPage {
  page_number: number
  type?: string
  text_content: string
  scene_description: string
}

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

  const rawPages = typeof story.pages === 'string' ? JSON.parse(story.pages) : story.pages
  const pages = (rawPages as StoryPage[]).map(p => {
    const filename = `${slug}/page-${String(p.page_number).padStart(2, '0')}.png`
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    return { ...p, illustration_url: data.publicUrl }
  })

  return <StoryReader title={story.title} pages={pages} slug={slug} />
}

import type { Metadata } from 'next'
import Header from '@/components/marketing/Header'
import { getShowcaseStories } from '@/lib/featured-stories'
import GalleryGrid, { GalleryStory } from './GalleryGrid'

export const metadata: Metadata = {
  title: 'Story Gallery | Storybook Studio',
  description: 'Browse personalized illustrated storybooks created with Storybook Studio.',
}

export default async function GalleryPage() {
  // Same curated pool the landing page uses (featured candidates from the DB,
  // with a static fallback). Hero + samples, deduped by slug.
  const showcase = await getShowcaseStories()
  const seen = new Set<string>()
  const stories: GalleryStory[] = [
    { slug: showcase.hero.slug, title: showcase.hero.title, tag: 'Featured' },
    ...showcase.samples,
  ].filter((s) => (seen.has(s.slug) ? false : (seen.add(s.slug), true)))

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-14 md:py-20">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-3">
            Gallery
          </p>
          <h1 className="font-display text-3xl md:text-5xl text-ink leading-tight">
            Featured storybooks
          </h1>
          <p className="mt-3 text-ink-soft max-w-xl">
            Personalized illustrated stories made with Storybook Studio.
          </p>
        </div>
        <GalleryGrid stories={stories} />
      </main>
    </div>
  )
}

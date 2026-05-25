import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const SITE_URL = (process.env.APP_URL ?? 'https://storybookstudio.org').replace(/\/$/, '')

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,        lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/wizard`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/terms`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Featured stories are publicly readable and good crawl targets.
  // Best-effort: if Supabase is unavailable during build/ISR, fall back to
  // static-only rather than failing the sitemap.
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('slug, created_at')
      .eq('featured_candidate', true)
      .eq('images_done', true)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const storyEntries: MetadataRoute.Sitemap = (data ?? []).map((row) => ({
      url: `${SITE_URL}/read/${row.slug}`,
      lastModified: row.created_at ? new Date(row.created_at as string) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    return [...staticEntries, ...storyEntries]
  } catch (err) {
    console.error('[sitemap] failed to fetch featured stories:', err)
    return staticEntries
  }
}

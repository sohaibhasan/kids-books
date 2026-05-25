import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { Genre, WizardFormData } from '@/types'
import { GENRES } from '@/components/wizard/steps/StepGenre'
import { LESSONS } from '@/components/wizard/steps/StepTheme'

const BUCKET = 'story-images'
const COOKIE_NAME = 'kb_showcase'
const CANDIDATE_QUERY_LIMIT = 60
const SAMPLE_COUNT = 4

export interface HeroStory {
  slug: string
  title: string
  coverUrl: string
  excerpt: string
}

export interface SampleStory {
  slug: string
  title: string
  tag: string
}

export interface Showcase {
  hero: HeroStory
  samples: SampleStory[]
}

// Fallback used when the candidate pool is empty (e.g. fresh dev DB) so the
// home page never breaks. Mirrors the historic hardcoded set.
const FALLBACK: Showcase = {
  hero: {
    slug: 'minha-y0mfr',
    title: 'Minha and the Mountain of Stars',
    coverUrl:
      'https://yfmlegmlkqkzpxotajna.supabase.co/storage/v1/object/public/story-images/minha-y0mfr/page-00.png',
    excerpt:
      'Minha tilted her chin up to the night and let the mountain count out its stars, one by one…',
  },
  samples: [
    { slug: 'jake-1uq15',    title: 'Jake and the Bees of Clover Hill Farm', tag: 'Nature · Trying New Things' },
    { slug: 'john-tq6l4',    title: 'John and the Zoomberry Star',           tag: 'Sci-fi · Resilience' },
    { slug: 'aamilah-u9n5m', title: 'Aamilah and the Mountain of Giving',    tag: 'Adventure · Generosity' },
    { slug: 'minha-y0mfr',   title: 'Minha and the Mountain of Stars',       tag: 'Fairy-tale · Wonder' },
  ],
}

interface CandidateRow {
  slug: string
  title: string
  form: WizardFormData | null
  pages: unknown
}

interface StoryPage {
  page_number: number
  type?: string
  text_content?: string
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function coverUrlFor(slug: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${slug}/page-00.png`)
  return data.publicUrl
}

function genreLabel(genre: Genre | string | undefined): string | undefined {
  if (!genre) return undefined
  return GENRES.find((g) => g.value === genre)?.label
}

function lessonLabel(lesson: string | undefined): string | undefined {
  if (!lesson) return undefined
  return LESSONS.find((l) => l.value === lesson)?.label ?? lesson
}

function deriveTag(form: WizardFormData | null): string {
  if (!form) return 'Storybook'
  const parts = [genreLabel(form.genre), lessonLabel(form.lesson)].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Storybook'
}

function deriveExcerpt(pagesRaw: unknown, title: string): string {
  const pages = (typeof pagesRaw === 'string' ? JSON.parse(pagesRaw) : pagesRaw) as StoryPage[] | null
  if (!Array.isArray(pages)) return title
  // Skip cover/end pages; pick the first page with real prose.
  const firstStory = pages.find((p) => p?.type !== 'cover' && p?.type !== 'end' && p?.text_content)
  const text = firstStory?.text_content?.trim()
  if (!text) return title
  if (text.length <= 140) return text
  // Trim at sentence boundary near 120 chars when possible, else word boundary.
  const window = text.slice(0, 160)
  const sentenceEnd = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '))
  if (sentenceEnd > 60) return window.slice(0, sentenceEnd + 1)
  const wordEnd = window.lastIndexOf(' ', 120)
  return `${window.slice(0, wordEnd > 60 ? wordEnd : 120).trimEnd()}…`
}

function toHero(row: CandidateRow): HeroStory {
  return {
    slug: row.slug,
    title: row.title,
    coverUrl: coverUrlFor(row.slug),
    excerpt: deriveExcerpt(row.pages, row.title),
  }
}

function toSample(row: CandidateRow): SampleStory {
  return {
    slug: row.slug,
    title: row.title,
    tag: deriveTag(row.form ?? null),
  }
}

async function fetchCandidates(): Promise<CandidateRow[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('slug, title, form, pages')
    .eq('featured_candidate', true)
    .eq('images_done', true)
    .limit(CANDIDATE_QUERY_LIMIT)
  if (error) {
    console.warn('[featured-stories] candidate query failed:', error.message)
    return []
  }
  return (data ?? []) as CandidateRow[]
}

function buildFromPinned(pinned: { hero: string; samples: string[] }, rows: CandidateRow[]): Showcase | null {
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const heroRow = bySlug.get(pinned.hero)
  if (!heroRow) return null
  const sampleRows: CandidateRow[] = []
  for (const slug of pinned.samples) {
    const r = bySlug.get(slug)
    if (!r) return null
    sampleRows.push(r)
  }
  if (sampleRows.length !== SAMPLE_COUNT) return null
  return { hero: toHero(heroRow), samples: sampleRows.map(toSample) }
}

export async function getShowcaseStories(): Promise<Showcase> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value

  let pinned: { hero: string; samples: string[] } | null = null
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        typeof parsed.hero === 'string' &&
        Array.isArray(parsed.samples) &&
        parsed.samples.length === SAMPLE_COUNT &&
        parsed.samples.every((s: unknown) => typeof s === 'string')
      ) {
        pinned = parsed
      }
    } catch {
      /* malformed cookie — fall through to fresh pick */
    }
  }

  const candidates = await fetchCandidates()

  if (pinned) {
    const reused = buildFromPinned(pinned, candidates)
    if (reused) return reused
    // Pinned slugs no longer valid (story unfeatured/deleted) — fall through.
  }

  if (candidates.length < SAMPLE_COUNT + 1) {
    return FALLBACK
  }

  const shuffled = shuffle(candidates)
  const heroRow = shuffled[0]
  const sampleRows = shuffled.slice(1, 1 + SAMPLE_COUNT)

  try {
    jar.set(COOKIE_NAME, JSON.stringify({
      hero: heroRow.slug,
      samples: sampleRows.map((r) => r.slug),
    }), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      // No maxAge → session cookie, cleared when the browser closes.
    })
  } catch {
    // cookies().set throws in static-render contexts; safe to ignore — caller
    // just won't get a pinned selection on the next request.
  }

  return { hero: toHero(heroRow), samples: sampleRows.map(toSample) }
}

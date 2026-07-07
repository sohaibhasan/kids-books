const STORAGE_KEY = 'kb_my_stories'
const MAX_ENTRIES = 50

export interface MyStoryEntry {
  slug: string
  title: string | null
  child_name: string
  created_at: string
}

function read(): MyStoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as MyStoryEntry[]
  } catch {
    return []
  }
}

function write(entries: MyStoryEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // quota exceeded or private browsing — ignore
  }
}

/** Prepend a new entry (newest first). No-op if the slug is already present. */
export function addMyStory(entry: MyStoryEntry): void {
  if (typeof window === 'undefined') return
  const existing = read()
  if (existing.some((e) => e.slug === entry.slug)) return
  write([entry, ...existing].slice(0, MAX_ENTRIES))
}

/** Patch the title on an existing entry once text generation completes. */
export function updateMyStoryTitle(slug: string, title: string): void {
  if (typeof window === 'undefined') return
  const existing = read()
  write(existing.map((e) => (e.slug === slug ? { ...e, title } : e)))
}

/** Return all entries newest-first, deduplicated by slug, capped at MAX_ENTRIES. */
export function getMyStories(): MyStoryEntry[] {
  return read()
}

// --- useSyncExternalStore adapters -----------------------------------------
// The snapshot must be referentially stable between calls or React loops, so
// we cache the parsed array keyed on the raw localStorage string.

const EMPTY: MyStoryEntry[] = []
let snapshotCache: { raw: string | null; parsed: MyStoryEntry[] } = { raw: null, parsed: EMPTY }

export function subscribeMyStories(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

export function getMyStoriesSnapshot(): MyStoryEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw !== snapshotCache.raw) {
    snapshotCache = { raw, parsed: raw ? read() : EMPTY }
  }
  return snapshotCache.parsed
}

export function getMyStoriesServerSnapshot(): MyStoryEntry[] {
  return EMPTY
}

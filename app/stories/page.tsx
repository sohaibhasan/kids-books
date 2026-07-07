'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useSyncExternalStore } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import Header from '@/components/marketing/Header'
import Button from '@/components/ui/Button'
import { fadeUp, staggerChildren } from '@/lib/motion'
import {
  getMyStoriesServerSnapshot,
  getMyStoriesSnapshot,
  MyStoryEntry,
  subscribeMyStories,
} from '@/lib/my-stories'

const SUPABASE_PUBLIC = 'https://yfmlegmlkqkzpxotajna.supabase.co/storage/v1/object/public/story-images'

function StoryCard({ entry }: { entry: MyStoryEntry }) {
  const [coverMissing, setCoverMissing] = useState(false)
  const title = entry.title ?? `${entry.child_name}'s story`
  const created = new Date(entry.created_at)
  const dateLabel = isNaN(created.getTime())
    ? ''
    : created.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        href={`/read/${entry.slug}`}
        className="group block rounded-xl overflow-hidden bg-surface-raised border border-border shadow-sm hover:shadow-lg transition-shadow"
      >
        <div className="relative aspect-[4/5] bg-surface-sunken">
          {coverMissing ? (
            <div className="absolute inset-0 flex items-center justify-center bg-story-lavender/40">
              <span className="font-display text-5xl text-ink/40">
                {entry.child_name.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <Image
              src={`${SUPABASE_PUBLIC}/${entry.slug}/page-00.png`}
              alt={`Cover illustration for ${title}`}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={() => setCoverMissing(true)}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
            {dateLabel && (
              <p className="text-[11px] uppercase tracking-widest text-white/85 font-semibold drop-shadow">
                {dateLabel}
              </p>
            )}
            <h3 className="font-display text-lg text-white leading-tight mt-1 drop-shadow">{title}</h3>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between text-sm text-ink-soft">
          <span>Read the book</span>
          <ArrowUpRight
            className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            aria-hidden
          />
        </div>
      </Link>
    </motion.div>
  )
}

export default function MyStoriesPage() {
  // localStorage is only readable on the client; useSyncExternalStore hydrates
  // from the empty server snapshot then re-renders with the device library
  // (and picks up cross-tab changes via the storage event).
  const entries = useSyncExternalStore(subscribeMyStories, getMyStoriesSnapshot, getMyStoriesServerSnapshot)

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-14 md:py-20">
        <motion.div initial="hidden" animate="show" variants={staggerChildren(0.08)}>
          <motion.p
            variants={fadeUp}
            className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-3"
          >
            Your library
          </motion.p>
          <motion.h1 variants={fadeUp} className="font-display text-3xl md:text-5xl text-ink leading-tight">
            My stories
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 text-ink-soft max-w-xl">
            Stories created on this device. Clearing your browser data clears this list — keep the
            share links for anything you want to hold on to.
          </motion.p>
        </motion.div>

        {entries.length === 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-14 flex flex-col items-center text-center rounded-xl border border-border bg-surface-raised px-8 py-16"
          >
            <span className="inline-flex size-14 items-center justify-center rounded-pill bg-story-apricot/50 mb-5">
              <BookOpen className="size-6 text-ink/70" aria-hidden />
            </span>
            <h2 className="font-display text-2xl text-ink">No stories yet</h2>
            <p className="mt-2 text-ink-soft max-w-sm">
              Make your first personalized storybook — it only takes a couple of minutes.
            </p>
            <Link href="/wizard" className="mt-6">
              <Button>Create a story</Button>
            </Link>
          </motion.div>
        )}

        {entries.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerChildren(0.06)}
            className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {entries.map((e) => (
              <StoryCard key={e.slug} entry={e} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}

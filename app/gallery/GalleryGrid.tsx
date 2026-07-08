'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { fadeUp, staggerChildren } from '@/lib/motion'

const SUPABASE_PUBLIC = 'https://yfmlegmlkqkzpxotajna.supabase.co/storage/v1/object/public/story-images'

export interface GalleryStory {
  slug: string
  title: string
  tag: string
}

interface Props {
  stories: GalleryStory[]
}

export default function GalleryGrid({ stories }: Props) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerChildren(0.08)}
      className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {stories.map((s) => (
        <motion.a
          key={s.slug}
          href={`/read/${s.slug}`}
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="group block rounded-xl overflow-hidden bg-surface-raised border border-border shadow-sm hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-[4/5] bg-surface-sunken">
            <Image
              src={`${SUPABASE_PUBLIC}/${s.slug}/page-00.png`}
              alt={`Cover illustration for ${s.title}`}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <p className="text-[11px] uppercase tracking-widest text-white/85 font-semibold drop-shadow">
                {s.tag}
              </p>
              <h3 className="font-display text-lg text-white leading-tight mt-1 drop-shadow">
                {s.title}
              </h3>
            </div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between text-sm text-ink-soft">
            <span>Read the book</span>
            <ArrowUpRight
              className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              aria-hidden
            />
          </div>
        </motion.a>
      ))}
    </motion.div>
  )
}

'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { fadeUp, staggerChildren } from '@/lib/motion'

const SUPABASE_PUBLIC = 'https://yfmlegmlkqkzpxotajna.supabase.co/storage/v1/object/public/story-images'

export interface SampleStory {
  slug: string
  title: string
  tag: string
}

interface Props {
  samples: SampleStory[]
}

export default function SampleShowcase({ samples }: Props) {
  return (
    <section id="examples" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerChildren(0.08)}
          className="flex items-end justify-between gap-6 mb-10 md:mb-14"
        >
          <div>
            <motion.p
              variants={fadeUp}
              className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-3"
            >
              Examples
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-5xl text-ink leading-tight">
              Stories made by other families.
            </motion.h2>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerChildren(0.08)}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {samples.map((s) => (
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
                <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

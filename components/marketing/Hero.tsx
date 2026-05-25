'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Sparkles, Clock, Printer } from 'lucide-react'
import { fadeUp, staggerChildren } from '@/lib/motion'
import Button from '@/components/ui/Button'

export interface HeroStory {
  slug: string
  title: string
  coverUrl: string
  excerpt: string
}

interface Props {
  hero: HeroStory
}

export default function Hero({ hero }: Props) {
  return (
    <section className="relative overflow-hidden">
      {/* Soft gradient blob */}
      <div
        aria-hidden
        className="absolute -top-32 -right-24 size-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--accent-tint), transparent 60%)' }}
      />
      <div
        aria-hidden
        className="absolute top-40 -left-20 size-[360px] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--brand-tint), transparent 60%)' }}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-12 pb-20 md:pt-20 md:pb-28">
        <motion.div
          variants={staggerChildren(0.08)}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 gap-10 md:gap-16 items-center"
        >
          {/* Copy column */}
          <div className="text-center md:text-left">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-5 px-3 h-7 rounded-pill bg-brand-tint text-brand-deep text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="size-3.5" aria-hidden />
              New · personalized in 2 minutes
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-[44px] sm:text-6xl md:text-[68px] leading-[1.05] text-ink"
            >
              A storybook starring{' '}
              <span className="italic text-brand">your</span> kid.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg text-ink-soft max-w-lg mx-auto md:mx-0 leading-relaxed"
            >
              Pick a child, a world, a lesson. We&apos;ll write and illustrate a one-of-a-kind picture book they&apos;ll ask for again and again.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col sm:flex-row items-center md:items-start gap-3 md:justify-start justify-center"
            >
              <Link href="/wizard">
                <Button size="xl" iconRight={<ArrowRight className="size-4" aria-hidden />}>
                  Create your story
                </Button>
              </Link>
              <a href="#examples">
                <Button size="xl" variant="ghost">
                  See an example
                </Button>
              </a>
            </motion.div>

            <motion.ul
              variants={fadeUp}
              className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted justify-center md:justify-start"
            >
              <li className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5" aria-hidden /> Free to try
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden /> ~2 minutes
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Printer className="size-3.5" aria-hidden /> Print-ready
              </li>
            </motion.ul>
          </div>

          {/* Mockup column */}
          <motion.div
            variants={fadeUp}
            className="relative mx-auto md:ml-auto w-full max-w-md"
          >
            <HeroMockup hero={hero} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function HeroMockup({ hero }: { hero: HeroStory }) {
  const text = hero.excerpt ?? ''
  const firstChar = text.charAt(0) || 'A'
  const rest = text.slice(1)
  return (
    <div className="relative">
      {/* Stacked book shadow */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl bg-accent-tint"
      />
      <div
        aria-hidden
        className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-xl bg-brand-tint"
      />
      <Link
        href={`/read/${hero.slug}`}
        className="relative block rounded-xl bg-surface-raised shadow-xl overflow-hidden border border-border group"
      >
        <div className="relative aspect-[4/5] w-full bg-surface-sunken">
          <Image
            src={hero.coverUrl}
            alt={`Cover illustration for ${hero.title}`}
            fill
            priority
            sizes="(min-width: 768px) 480px, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
            <p className="text-[11px] uppercase tracking-widest text-white/85 font-semibold drop-shadow">
              A Storybook Studio Original
            </p>
            <h3 className="font-display text-3xl text-white leading-tight mt-1 drop-shadow">
              {hero.title}
            </h3>
          </div>
        </div>
        <div className="p-5 border-t border-border">
          <p className="text-sm text-ink-soft leading-relaxed">
            <span className="drop-cap">{firstChar}</span>{rest}
          </p>
        </div>
      </Link>
    </div>
  )
}

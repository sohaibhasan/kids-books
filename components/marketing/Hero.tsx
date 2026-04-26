'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Sparkles, Clock, Printer } from 'lucide-react'
import { fadeUp, staggerChildren } from '@/lib/motion'
import Button from '@/components/ui/Button'

export default function Hero() {
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
              <Sparkles className="size-3.5" />
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
                <Button size="xl" iconRight={<ArrowRight className="size-4" />}>
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
                <Sparkles className="size-3.5" /> Free to try
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" /> ~2 minutes
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Printer className="size-3.5" /> Print-ready
              </li>
            </motion.ul>
          </div>

          {/* Mockup column */}
          <motion.div
            variants={fadeUp}
            className="relative mx-auto md:ml-auto w-full max-w-md"
          >
            <HeroMockup />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function HeroMockup() {
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
      <div className="relative rounded-xl bg-surface-raised shadow-xl overflow-hidden border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://sohaibhasan.github.io/kids-books/stories/aamilah-and-the-dragon-treasure/"
          alt=""
          aria-hidden
          className="hidden"
        />
        <div
          className="aspect-[4/5] w-full bg-cover bg-center"
          style={{
            background:
              'linear-gradient(135deg, var(--story-apricot) 0%, var(--brand-tint) 50%, var(--story-rose) 100%)',
          }}
        >
          <div className="h-full w-full flex flex-col justify-end p-6">
            <div className="size-12 rounded-pill bg-white/70 backdrop-blur flex items-center justify-center text-2xl mb-3">
              🐉
            </div>
            <p className="text-[11px] uppercase tracking-widest text-ink/60 font-semibold">A Storybook Studio Original</p>
            <h3 className="font-display text-3xl text-ink leading-tight mt-1">
              Aamilah and the Dragon&apos;s Treasure
            </h3>
          </div>
        </div>
        <div className="p-5 border-t border-border">
          <p className="text-sm text-ink-soft leading-relaxed">
            <span className="drop-cap">A</span>amilah pressed her palm to the cool stone door, and the
            mountain answered with a low, kindly hum…
          </p>
        </div>
      </div>
    </div>
  )
}

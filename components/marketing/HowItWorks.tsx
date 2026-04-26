'use client'

import { motion } from 'motion/react'
import { Wand2, Palette, BookOpen } from 'lucide-react'
import Card from '@/components/ui/Card'
import { fadeUp, staggerChildren } from '@/lib/motion'

const STEPS = [
  {
    icon: <Wand2 className="size-5" />,
    title: 'Tell us about your child',
    body: 'Name, age, looks, and the lesson you want them to remember.',
    tone: 'bg-brand-tint text-brand-deep',
  },
  {
    icon: <Palette className="size-5" />,
    title: 'Pick the world & style',
    body: 'Eight art aesthetics, eight writing voices, six tones — mix freely.',
    tone: 'bg-accent-tint text-ink',
  },
  {
    icon: <BookOpen className="size-5" />,
    title: 'Get an illustrated book',
    body: 'A page-by-page story in about two minutes — share, read, or print.',
    tone: 'bg-[var(--story-sage)]/40 text-ink',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-28 bg-surface-sunken/60">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerChildren(0.08)}
          className="text-center mb-12 md:mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-3"
          >
            How it works
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display text-3xl md:text-5xl text-ink leading-tight"
          >
            Three small choices,<br /> one unforgettable book.
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerChildren(0.1)}
          className="grid md:grid-cols-3 gap-5"
        >
          {STEPS.map((s, i) => (
            <motion.div key={s.title} variants={fadeUp}>
              <Card variant="raised" padding="lg" className="h-full">
                <div className={`size-11 rounded-pill inline-flex items-center justify-center ${s.tone}`}>
                  {s.icon}
                </div>
                <p className="mt-5 text-xs uppercase tracking-widest text-ink-muted font-semibold font-numeral">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-display text-2xl text-ink leading-snug">{s.title}</h3>
                <p className="mt-2 text-ink-soft leading-relaxed">{s.body}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

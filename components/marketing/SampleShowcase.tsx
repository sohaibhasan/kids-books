'use client'

import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { fadeUp, staggerChildren } from '@/lib/motion'

const SAMPLES = [
  {
    title: "Aamilah and the Dragon's Treasure",
    href: 'https://sohaibhasan.github.io/kids-books/stories/aamilah-and-the-dragon-treasure/',
    gradient: 'linear-gradient(135deg, var(--story-apricot), var(--brand-tint))',
    emoji: '🐉',
    tag: 'Adventure · Bravery',
  },
  {
    title: 'Minha and the Kind Little Spark',
    href: 'https://sohaibhasan.github.io/kids-books/stories/minha-and-the-kind-little-spark/',
    gradient: 'linear-gradient(135deg, var(--story-sky), var(--story-lavender))',
    emoji: '✨',
    tag: 'Heartfelt · Kindness',
  },
  {
    title: 'Your story · coming soon',
    href: '/wizard',
    gradient: 'linear-gradient(135deg, var(--story-sage), var(--accent-tint))',
    emoji: '📖',
    tag: 'Make it yours',
    placeholder: true,
  },
]

export default function SampleShowcase() {
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
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {SAMPLES.map((s) => (
            <motion.a
              key={s.title}
              href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group block rounded-xl overflow-hidden bg-surface-raised border border-border shadow-sm hover:shadow-lg transition-shadow"
            >
              <div
                className="aspect-[4/5] flex items-end p-6"
                style={{ background: s.gradient }}
              >
                <div className="w-full">
                  <div className="size-12 rounded-pill bg-white/70 backdrop-blur inline-flex items-center justify-center text-2xl mb-3">
                    {s.emoji}
                  </div>
                  <p className="text-[11px] uppercase tracking-widest text-ink/70 font-semibold">{s.tag}</p>
                  <h3 className="font-display text-xl text-ink leading-tight mt-1">{s.title}</h3>
                </div>
              </div>
              <div className="px-5 py-4 flex items-center justify-between text-sm text-ink-soft">
                <span>{s.placeholder ? 'Start the wizard' : 'Read the book'}</span>
                <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

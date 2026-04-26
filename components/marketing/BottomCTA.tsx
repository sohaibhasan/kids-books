'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { fadeUp } from '@/lib/motion'

export default function BottomCTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="relative overflow-hidden rounded-xl bg-brand text-white px-8 py-14 md:py-20 text-center shadow-lg"
        >
          <div
            aria-hidden
            className="absolute -top-24 -right-24 size-80 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, var(--accent), transparent 60%)' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 size-80 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, white, transparent 60%)' }}
          />

          <h2 className="relative font-display text-3xl md:text-5xl leading-tight">
            Ready when you are.
          </h2>
          <p className="relative mt-4 text-white/85 text-lg max-w-md mx-auto">
            Two minutes, one story, a thousand bedtimes.
          </p>
          <div className="relative mt-8 inline-block">
            <Link href="/wizard">
              <Button
                size="xl"
                variant="accent"
                iconRight={<ArrowRight className="size-4" />}
              >
                Create your story
              </Button>
            </Link>
          </div>
          <p className="relative mt-5 text-white/70 text-sm">Free to try · ~2 minutes · Print-ready</p>
        </motion.div>
      </div>
    </section>
  )
}

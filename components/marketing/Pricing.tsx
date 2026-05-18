'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Check, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { fadeUp, staggerChildren } from '@/lib/motion'

// Operational source of truth lives in lib/credits.ts (PACKS). Mirror the
// numbers here for the marketing copy — they change rarely, and importing
// the server module would drag the Supabase service-role client into the
// client bundle.
const TIERS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    priceNote: 'No card required',
    cta: 'Start free',
    highlight: false,
    badge: null as string | null,
    features: [
      '1 fully illustrated storybook',
      'Up to 20 personalized pages',
      'Choose art style, voice, lesson',
      'Share via link',
    ],
  },
  {
    key: 'solo',
    name: 'Single',
    price: '$3.50',
    priceNote: 'One-time · just one story',
    cta: 'Buy 1 story',
    highlight: false,
    badge: null as string | null,
    features: [
      '1 fully illustrated storybook',
      'No subscription, ever',
      'Failed generations auto-refunded',
      'Email-link recovery across devices',
    ],
  },
  {
    key: 'small',
    name: '3-pack',
    price: '$10',
    priceNote: 'One-time · $3.33 / story',
    cta: 'Choose 3-pack',
    highlight: true,
    badge: 'Most popular',
    features: [
      '3 fully illustrated storybooks',
      'Small per-story discount',
      'Failed generations auto-refunded',
      'Email-link recovery across devices',
    ],
  },
  {
    key: 'large',
    name: '10-pack',
    price: '$25',
    priceNote: 'One-time · $2.50 / story',
    cta: 'Choose 10-pack',
    highlight: false,
    badge: 'Best value',
    features: [
      '10 fully illustrated storybooks',
      'Save 29% vs buying singles',
      'Failed generations auto-refunded',
      'Email-link recovery across devices',
    ],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-surface-sunken">
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
            Pricing
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display text-3xl md:text-5xl text-ink leading-tight"
          >
            Pay once. Read forever.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-ink-soft max-w-xl mx-auto"
          >
            Try your first story free. When the kids ask for more, grab a credit pack — no
            account, no subscription, and we refund credits for any story that fails to finish.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerChildren(0.08)}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
        >
          {TIERS.map((t) => (
            <motion.div
              key={t.key}
              variants={fadeUp}
              className={cn(
                'relative rounded-xl border bg-surface-raised p-7 flex flex-col',
                t.highlight
                  ? 'border-brand shadow-lg ring-2 ring-brand/10'
                  : 'border-border shadow-sm',
              )}
            >
              {t.badge && (
                <span
                  className={cn(
                    'absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 h-6 rounded-pill text-[11px] uppercase tracking-widest font-semibold',
                    t.highlight ? 'bg-brand text-white' : 'bg-ink text-white',
                  )}
                >
                  {t.highlight && <Sparkles className="size-3" />}
                  {t.badge}
                </span>
              )}

              <h3 className="font-display text-2xl text-ink">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl text-ink leading-none">{t.price}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{t.priceNote}</p>

              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                    <Check className="size-4 text-brand shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 pt-0 flex-1 flex items-end">
                <Link href="/wizard" className="w-full">
                  <Button
                    fullWidth
                    variant={t.highlight ? 'primary' : 'secondary'}
                    size="lg"
                  >
                    {t.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
          className="mt-10 text-center text-sm text-ink-muted"
        >
          No accounts. No subscriptions. Failed generations are automatically refunded.
        </motion.p>
      </div>
    </section>
  )
}

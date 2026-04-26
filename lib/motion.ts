import type { Transition, Variants } from 'motion/react'

export const ease = [0.22, 1, 0.36, 1] as const

export const durations = {
  fast: 0.15,
  base: 0.22,
  slow: 0.4,
} as const

export const springs = {
  gentle: { type: 'spring', stiffness: 140, damping: 22 } as const satisfies Transition,
  snappy: { type: 'spring', stiffness: 260, damping: 22 } as const satisfies Transition,
  soft:   { type: 'spring', stiffness: 90,  damping: 18 } as const satisfies Transition,
}

// Wizard step transitions (slide + fade)
export const stepVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 28 : -28,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.base, ease },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -28 : 28,
    transition: { duration: durations.fast, ease },
  }),
}

// Reader page transitions
export const readerPageVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.slow, ease },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
    transition: { duration: durations.base, ease },
  }),
}

// Generic fade-up for hero / sections
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: durations.slow, ease } },
}

// Stagger children helper
export const staggerChildren = (delay = 0.06): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})

// Thumbnail entrance for generating page
export const thumbReveal: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: springs.gentle },
}

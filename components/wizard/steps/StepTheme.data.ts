// Server-safe data module — keep separate from StepTheme.tsx (a 'use client'
// component) so server consumers like lib/featured-stories.ts can import
// the option list without it being replaced by a client-reference proxy.
export const LESSONS: { value: string; icon: string; label: string }[] = [
  { value: 'Kindness',           icon: '❤️',  label: 'Kindness' },
  { value: 'Bravery',            icon: '🦁',  label: 'Bravery' },
  { value: 'Honesty',            icon: '💎',  label: 'Honesty' },
  { value: 'Sharing',            icon: '🤝',  label: 'Sharing' },
  { value: 'Managing Emotions',  icon: '🌈',  label: 'Emotions' },
  { value: 'Trying New Things',  icon: '🌱',  label: 'Try New Things' },
  { value: 'Inclusivity',        icon: '🌍',  label: 'Inclusivity' },
  { value: 'Environmental Care', icon: '🌳',  label: 'Nature Care' },
  { value: 'Resilience',         icon: '💪',  label: 'Resilience' },
  { value: 'Friendship',         icon: '👫',  label: 'Friendship' },
  { value: 'Gratitude',          icon: '🙏',  label: 'Gratitude' },
  { value: 'Generosity',         icon: '🎁',  label: 'Generosity' },
]

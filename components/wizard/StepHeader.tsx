interface StepHeaderProps {
  eyebrow?: string
  title: string
  description?: string
}

export default function StepHeader({ eyebrow, title, description }: StepHeaderProps) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-xs uppercase tracking-widest text-brand font-semibold mb-3">{eyebrow}</p>
      )}
      <h1 className="font-display text-3xl md:text-4xl text-ink leading-tight">{title}</h1>
      {description && (
        <p className="mt-2 text-ink-soft text-[15px] leading-relaxed max-w-prose">{description}</p>
      )}
    </div>
  )
}

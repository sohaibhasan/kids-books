'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { WizardFormData } from '@/types'
import Stepper from '@/components/ui/Stepper'
import Button from '@/components/ui/Button'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { stepVariants } from '@/lib/motion'
import StepChild from './steps/StepChild'
import StepGenre from './steps/StepGenre'
import StepTheme from './steps/StepTheme'
import StepSetting from './steps/StepSetting'
import StepStyle from './steps/StepStyle'
import StepVoice from './steps/StepVoice'
import StepReview from './steps/StepReview'

const STEP_LABELS = ['About', 'Genre', 'Lesson', 'World', 'Style', 'Voice', 'Review']
const TOTAL_STEPS = STEP_LABELS.length

const defaultData: WizardFormData = {
  child_name: '',
  child_age: 6,
  child_pronouns: 'She / Her',
  skin_tone: '',
  hair_color: '',
  hair_style: '',
  eye_color: '',
  outfit: '',
  child_appearance: '',
  genre: 'adventure',
  theme: 'Bravery',
  lesson: 'Bravery',
  setting: 'Enchanted Forest',
  supporting_characters: '',
  companion_name: '',
  art_style: 'comic-book',
  length: 'medium',
  writing_style: 'lyrical-imaginative',
  tone: 'adventurous',
  depth_modifiers: [],
  image_quality: 'standard',
  language: 'English',
}

function canAdvance(step: number, data: WizardFormData): boolean {
  if (step === 1) return data.child_name.trim().length > 0
  if (step === 2) return !!data.genre
  if (step === 3) return !!data.lesson
  if (step === 4) return !!data.setting
  if (step === 6) return !!data.writing_style && !!data.tone
  return true
}

function WizardInner() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardFormData>(defaultData)
  const [submitting, setSubmitting] = useState(false)
  const directionRef = useRef(1)

  const update = (fields: Partial<WizardFormData>) => setData((prev) => ({ ...prev, ...fields }))

  const goTo = (target: number) => {
    directionRef.current = target > step ? 1 : -1
    setStep(Math.min(Math.max(target, 1), TOTAL_STEPS))
  }
  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }
      const { slug } = await res.json()
      router.push(`/generating/${slug}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({ tone: 'error', title: 'Could not create story', description: message })
      setSubmitting(false)
    }
  }

  const stepContent = (() => {
    switch (step) {
      case 1: return <StepChild data={data} onChange={update} />
      case 2: return <StepGenre data={data} onChange={update} />
      case 3: return <StepTheme data={data} onChange={update} />
      case 4: return <StepSetting data={data} onChange={update} />
      case 5: return <StepStyle data={data} onChange={update} />
      case 6: return <StepVoice data={data} onChange={update} />
      case 7: return <StepReview data={data} onJump={goTo} />
      default: return null
    }
  })()

  const isLastStep = step === TOTAL_STEPS
  const blockNext = !canAdvance(step, data)

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
          <p className="text-xs uppercase tracking-widest text-ink-muted font-numeral">
            Step {step} of {TOTAL_STEPS}
          </p>
          <span className="w-[88px] hidden sm:block" />
        </div>
        <div className="mx-auto max-w-3xl px-5 sm:px-8 pb-4">
          <Stepper current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />
        </div>
      </header>

      {/* Card */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-8 md:py-12">
          <div className="bg-surface-raised rounded-xl shadow-md p-5 sm:p-8 md:p-10">
            <AnimatePresence mode="wait" custom={directionRef.current} initial={false}>
              <motion.form
                key={step}
                custom={directionRef.current}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={(e) => e.preventDefault()}
              >
                {stepContent}
              </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Sticky footer nav */}
      <footer className="sticky bottom-0 z-30 bg-surface/85 backdrop-blur-md border-t border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 h-16 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1}
            iconLeft={<ArrowLeft className="size-4" />}
          >
            Back
          </Button>

          {isLastStep ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreate}
              loading={submitting}
              iconRight={!submitting ? <Sparkles className="size-4" /> : undefined}
            >
              {submitting ? 'Creating…' : 'Create my story'}
            </Button>
          ) : (
            <Button
              onClick={next}
              disabled={blockNext}
              iconRight={<ArrowRight className="size-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default function WizardContainer() {
  return (
    <ToastProvider>
      <WizardInner />
    </ToastProvider>
  )
}

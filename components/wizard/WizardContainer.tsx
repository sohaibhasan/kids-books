'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { WizardFormData } from '@/types'
import Stepper from '@/components/ui/Stepper'
import Button from '@/components/ui/Button'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { stepVariants } from '@/lib/motion'
import PaywallModal, { PaywallPack } from '@/components/paywall/PaywallModal'
import StepChild from './steps/StepChild'
import StepGenre from './steps/StepGenre'
import StepTheme from './steps/StepTheme'
import StepSetting from './steps/StepSetting'
import StepStyle from './steps/StepStyle'
import StepVoice from './steps/StepVoice'
import StepReview from './steps/StepReview'
import StoryPreview from './StoryPreview'

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
  language: 'English',
  feature_opt_in: false,
}

function canAdvance(step: number, data: WizardFormData): boolean {
  if (step === 1) return data.child_name.trim().length > 0
  if (step === 2) return !!data.genre
  if (step === 3) return !!data.lesson
  if (step === 4) return !!data.setting
  if (step === 6) return !!data.writing_style && !!data.tone
  return true
}

const RESUME_KEY = 'kb_wizard_resume'
const FORM_STASH_PREFIX = 'kb_wizard_form_'

function WizardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [furthestStep, setFurthestStep] = useState(1)
  const [data, setData] = useState<WizardFormData>(defaultData)
  const [submitting, setSubmitting] = useState(false)
  const [paywall, setPaywall] = useState<{ open: boolean; packs: PaywallPack[] }>({ open: false, packs: [] })
  const directionRef = useRef(1)
  const resumeFiredRef = useRef(false)

  const update = (fields: Partial<WizardFormData>) => setData((prev) => ({ ...prev, ...fields }))

  const goTo = (target: number) => {
    directionRef.current = target > step ? 1 : -1
    const clamped = Math.min(Math.max(target, 1), TOTAL_STEPS)
    setStep(clamped)
    setFurthestStep((prev) => Math.max(prev, clamped))
  }
  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)

  const submit = async (form: WizardFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/stories/precheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.status === 402) {
        const body = await res.json().catch(() => ({}))
        if (body?.paywall) {
          sessionStorage.setItem(RESUME_KEY, JSON.stringify(form))
          setPaywall({ open: true, packs: body.packs ?? [] })
          setSubmitting(false)
          return
        }
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }
      const { slug } = await res.json()
      sessionStorage.removeItem(RESUME_KEY)
      sessionStorage.setItem(`${FORM_STASH_PREFIX}${slug}`, JSON.stringify(form))
      router.push(`/generating/${slug}?phase=text`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast({ tone: 'error', title: 'Could not create story', description: message })
      setSubmitting(false)
    }
  }

  const handleCreate = () => submit(data)

  // Auto-resume after a successful Stripe checkout (?paid=1) or magic-link reclaim (?reclaimed=1).
  useEffect(() => {
    if (resumeFiredRef.current) return
    const paid = searchParams.get('paid') === '1'
    const reclaimed = searchParams.get('reclaimed') === '1'
    if (!paid && !reclaimed) return
    resumeFiredRef.current = true

    // Scrub the query param immediately so browser-back to /wizard doesn't
    // re-trigger the resume effect (which would re-submit + consume a credit).
    router.replace('/wizard')

    const stashed = sessionStorage.getItem(RESUME_KEY)
    if (paid && stashed) {
      try {
        const form = JSON.parse(stashed) as WizardFormData
        setData(form)
        setStep(7)
        setFurthestStep(7)
        toast({ tone: 'success', title: 'Payment received', description: 'Picking up where you left off.' })
        void submit(form)
        return
      } catch {
        /* fall through */
      }
    }
    if (reclaimed) {
      toast({ tone: 'success', title: 'Credits restored', description: 'Welcome back — your credits moved with you.' })
    } else if (paid) {
      toast({ tone: 'success', title: 'Payment received', description: 'Your credits are ready.' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stepContent = (() => {
    switch (step) {
      case 1: return <StepChild data={data} onChange={update} />
      case 2: return <StepGenre data={data} onChange={update} />
      case 3: return <StepTheme data={data} onChange={update} />
      case 4: return <StepSetting data={data} onChange={update} />
      case 5: return <StepStyle data={data} onChange={update} />
      case 6: return <StepVoice data={data} onChange={update} />
      case 7: return <StepReview data={data} onJump={goTo} onChange={update} />
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
        <div className="mx-auto max-w-3xl lg:max-w-6xl px-5 sm:px-8 py-8 md:py-12">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
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

            <div className="hidden lg:block lg:sticky lg:top-28">
              <StoryPreview data={data} step={furthestStep} />
            </div>
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

      <PaywallModal
        open={paywall.open}
        packs={paywall.packs}
        onClose={() => setPaywall((p) => ({ ...p, open: false }))}
      />
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

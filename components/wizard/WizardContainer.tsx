'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { WizardFormData } from '@/types'
import { isValidEmail } from '@/lib/utils'
import Stepper from '@/components/ui/Stepper'
import Button from '@/components/ui/Button'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { stepVariants } from '@/lib/motion'
import PaywallModal, { PaywallPack } from '@/components/paywall/PaywallModal'
import { addMyStory } from '@/lib/my-stories'
import { clearWizardDraft, readWizardDraft, saveWizardDraft, type WizardDraft } from '@/lib/wizard-draft'
import StepChild from './steps/StepChild'
import StepGenre from './steps/StepGenre'
import StepTheme from './steps/StepTheme'
import StepSetting from './steps/StepSetting'
import StepStyle from './steps/StepStyle'
import StepVoice from './steps/StepVoice'
import StepIdeas from './steps/StepIdeas'
import StepReview from './steps/StepReview'
import StoryPreview from './StoryPreview'

const STEP_LABELS = ['About', 'Genre', 'Lesson', 'World', 'Style', 'Voice', 'Ideas', 'Review']
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
  // step 7 = Ideas — fully optional, no gate (falls through to `return true`).
  if (step === 8) {
    // Review — email is optional, but if present it must be valid.
    if (!data.email) return true
    return isValidEmail(data.email)
  }
  return true
}

const RESUME_KEY = 'kb_wizard_resume'

function WizardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [furthestStep, setFurthestStep] = useState(1)
  const [data, setData] = useState<WizardFormData>(defaultData)
  const [submitting, setSubmitting] = useState(false)
  const [paywall, setPaywall] = useState<{ open: boolean; packs: PaywallPack[] }>({ open: false, packs: [] })
  const [direction, setDirection] = useState(1)
  const resumeFiredRef = useRef(false)
  const [draftOffer, setDraftOffer] = useState<WizardDraft | null>(null)

  const update = (fields: Partial<WizardFormData>) => setData((prev) => ({ ...prev, ...fields }))

  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1)
    const clamped = Math.min(Math.max(target, 1), TOTAL_STEPS)
    setStep(clamped)
    setFurthestStep((prev) => Math.max(prev, clamped))
  }
  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)

  const submit = async (form: WizardFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/stories/start', {
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
      clearWizardDraft()
      addMyStory({ slug, title: null, child_name: form.child_name, created_at: new Date().toISOString() })
      router.push(`/generating/${slug}`)
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

    if (paid) {
      const stashed = sessionStorage.getItem(RESUME_KEY)
      let form: WizardFormData | null = null
      if (stashed) {
        try {
          form = JSON.parse(stashed) as WizardFormData
        } catch (err) {
          // Corrupt stash — surface the parse error for debugging, then fall through to
          // the recovery toast below so the user isn't left confused.
          console.warn('[WizardContainer] Failed to parse stashed wizard data from sessionStorage:', err)
        }
      }

      if (form !== null) {
        // Valid stash: restore form, jump to review, and auto-resubmit.
        setData(form)
        setStep(TOTAL_STEPS)
        setFurthestStep(TOTAL_STEPS)
        toast({ tone: 'success', title: 'Payment received', description: 'Picking up where you left off.' })
        void submit(form)
        return
      }

      // Stash absent or corrupt: tell the user explicitly so they aren't left wondering
      // where their paid credit went, then land them somewhere useful.
      // If in-memory form data is already non-default (child_name differs from the
      // default empty string — indicates the user still has wizard state alive in this
      // tab), jump to the review step so they can resubmit immediately. Otherwise leave
      // them at step 1 to start fresh.
      //
      // Stash retention on failed resubmit: the stash is intentionally NOT removed when
      // submit() fails with a 402 or network error — keeping it allows a subsequent
      // Stripe redirect to re-attempt the submission automatically. It is only cleared on
      // a successful enqueue (see submit() above). We do not touch the stash here because
      // the failure is a parse error, not a submission attempt.
      toast({
        tone: 'success',
        title: 'Payment received — your credit is ready.',
        description: "We couldn’t restore your previous story details, so please review and submit again.",
      })
      if (data.child_name !== defaultData.child_name) {
        goTo(TOTAL_STEPS)
      }
      return
    }

    if (reclaimed) {
      toast({ tone: 'success', title: 'Credits restored', description: 'Welcome back — your credits moved with you.' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Offer to restore a saved draft on mount. Skipped entirely when arriving
  // from Stripe (?paid=1) or a magic link (?reclaimed=1) — those flows own the
  // restore path via sessionStorage. localStorage is read inside a timeout
  // callback (not synchronously in the effect) so the SSR'd markup matches the
  // first client render and the set-state-in-effect lint rule stays happy.
  useEffect(() => {
    if (searchParams.get('paid') === '1' || searchParams.get('reclaimed') === '1') return
    const t = setTimeout(() => {
      const draft = readWizardDraft()
      if (draft && draft.data.child_name.trim() !== '') setDraftOffer(draft)
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced draft autosave. Pristine state (nothing typed, still on step 1)
  // is never saved, so fresh visitors don't accumulate empty drafts.
  useEffect(() => {
    if (step === 1 && data.child_name.trim() === '') return
    const t = setTimeout(() => saveWizardDraft(step, data), 500)
    return () => clearTimeout(t)
  }, [step, data])

  const resumeDraft = () => {
    if (!draftOffer) return
    setData(draftOffer.data)
    goTo(draftOffer.step)
    setDraftOffer(null)
  }

  const discardDraft = () => {
    clearWizardDraft()
    setDraftOffer(null)
  }

  const stepContent = (() => {
    switch (step) {
      case 1: return <StepChild data={data} onChange={update} />
      case 2: return <StepGenre data={data} onChange={update} />
      case 3: return <StepTheme data={data} onChange={update} />
      case 4: return <StepSetting data={data} onChange={update} />
      case 5: return <StepStyle data={data} onChange={update} />
      case 6: return <StepVoice data={data} onChange={update} />
      case 7: return <StepIdeas data={data} onChange={update} />
      case 8: return <StepReview data={data} onJump={goTo} onChange={update} />
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
          {draftOffer && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised px-5 py-4 shadow-sm">
              <p className="text-sm text-ink-soft">
                Resume where you left off? You have a saved draft
                {draftOffer.data.child_name.trim() ? (
                  <> for <span className="font-medium text-ink">{draftOffer.data.child_name.trim()}</span></>
                ) : null}
                .
              </p>
              <div className="flex gap-2">
                <Button onClick={resumeDraft}>Resume</Button>
                <Button variant="ghost" onClick={discardDraft}>Start fresh</Button>
              </div>
            </div>
          )}
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
            <div className="bg-surface-raised rounded-xl shadow-md p-5 sm:p-8 md:p-10">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.form
                  key={step}
                  custom={direction}
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WizardFormData } from '@/types'
import ProgressBar from './ProgressBar'
import StepChild from './steps/StepChild'
import StepGenre from './steps/StepGenre'
import StepTheme from './steps/StepTheme'
import StepSetting from './steps/StepSetting'
import StepStyle from './steps/StepStyle'
import StepReview from './steps/StepReview'
import Button from '@/components/ui/Button'

const TOTAL_STEPS = 6

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
  art_style: 'dog-man',
  tone: 'adventurous',
  length: 'medium',
  image_quality: 'standard',
  language: 'English',
}

// Per-step validation — returns true if user can proceed
function canAdvance(step: number, data: WizardFormData): boolean {
  if (step === 1) return data.child_name.trim().length > 0
  if (step === 2) return !!data.genre
  if (step === 3) return !!data.lesson
  if (step === 4) return !!data.setting
  return true
}

export default function WizardContainer() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardFormData>(defaultData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const update = (fields: Partial<WizardFormData>) => setData(prev => ({ ...prev, ...fields }))
  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const handleCreate = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || `Server error ${res.status}`)
      }
      const { slug } = await res.json()
      router.push(`/generating/${slug}`)
    } catch (err) {
      setError(String(err))
      setSubmitting(false)
    }
  }

  const steps = [
    <StepChild key="child" data={data} onChange={update} />,
    <StepGenre key="genre" data={data} onChange={update} />,
    <StepTheme key="theme" data={data} onChange={update} />,
    <StepSetting key="setting" data={data} onChange={update} />,
    <StepStyle key="style" data={data} onChange={update} />,
    <StepReview key="review" data={data} />,
  ]

  const isLastStep = step === TOTAL_STEPS
  const blockNext = !canAdvance(step, data)

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-3xl">📖</span>
          <h1 className="text-2xl font-bold text-ink mt-1">Create Your Story</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border-4 border-ink shadow-[6px_6px_0_#1a1a1a] p-6 md:p-8 mb-6">
          <ProgressBar current={step} total={TOTAL_STEPS} />
          {steps[step - 1]}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1}
          >
            ← Back
          </Button>

          {isLastStep ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? '✨ Creating...' : '🚀 Create My Story!'}
            </Button>
          ) : (
            <Button
              onClick={next}
              disabled={blockNext}
            >
              Next →
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}

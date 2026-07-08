import type { WizardFormData } from '@/types'

const STORAGE_KEY = 'kb_wizard_draft'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // drafts older than a week are stale

export interface WizardDraft {
  step: number
  data: WizardFormData
  saved_at: string
}

export function saveWizardDraft(step: number, data: WizardFormData): void {
  if (typeof window === 'undefined') return
  try {
    const draft: WizardDraft = { step, data, saved_at: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // quota exceeded or private browsing — autosave is best-effort
  }
}

/** Read the saved draft; corrupt or expired drafts are removed and yield null. */
export function readWizardDraft(): WizardDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as WizardDraft
    const valid =
      draft &&
      typeof draft.step === 'number' &&
      draft.data &&
      typeof draft.data.child_name === 'string' &&
      typeof draft.saved_at === 'string'
    if (!valid || Date.now() - new Date(draft.saved_at).getTime() > MAX_AGE_MS) {
      clearWizardDraft()
      return null
    }
    return draft
  } catch {
    clearWizardDraft()
    return null
  }
}

export function clearWizardDraft(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

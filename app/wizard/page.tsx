import { Suspense } from 'react'
import WizardContainer from '@/components/wizard/WizardContainer'

export const metadata = {
  title: 'Create a Story — Storybook Studio',
}

export default function WizardPage() {
  return (
    <Suspense fallback={null}>
      <WizardContainer />
    </Suspense>
  )
}

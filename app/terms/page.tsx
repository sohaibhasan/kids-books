import type { Metadata } from 'next'
import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service — Storybook Studio',
  description: 'The terms under which Storybook Studio is provided.',
}

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <Header />
      <main className="flex-1">
        <article className="mx-auto max-w-2xl px-5 sm:px-8 py-16 md:py-24 prose-style">
          <p className="text-xs uppercase tracking-widest text-ink-muted font-numeral">
            Last updated: May 25, 2026
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mt-3">
            Terms of Service
          </h1>
          <p className="mt-6 text-ink-soft">
            By using Storybook Studio you agree to these terms. The service is in <b>alpha</b>:
            expect rough edges, occasional downtime, and changes as we learn.
          </p>

          <Section title="The service">
            <p>
              Storybook Studio generates personalized illustrated children&apos;s storybooks using
              AI. You provide a few inputs through a wizard; we produce text via Anthropic Claude
              and illustrations via one of several image providers, then assemble a page-by-page
              reader you can share or print.
            </p>
          </Section>

          <Section title="Eligibility">
            <p>
              You must be at least 13 years old to use the service and at least 18 to make a
              purchase. The service is designed to be used by adults on behalf of children.
            </p>
          </Section>

          <Section title="Free tier and credits">
            <p>
              Each device gets one free story. After that, additional stories require prepaid
              credits sold in packs (currently $2 / 1 story, $5 / 3 stories, $15 / 10 stories).
              Credits are tied to your device. If you purchase, we email you a one-time recovery
              link so you can move your credits to a new browser or device.
            </p>
            <p>
              Credits do not expire. They have no cash value and are not transferable.
            </p>
          </Section>

          <Section title="Refunds">
            <p>
              Prepaid credits are non-refundable, with one exception: if we fail to deliver a
              story you spent a credit on (for example, an image provider is down and we exhaust
              our retry budget), we automatically refund that credit back to your account.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to use the service to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Generate content involving real people without their consent</li>
              <li>
                Produce sexual, violent, hateful, or otherwise harmful material involving children
                or anyone else
              </li>
              <li>Attempt to bypass the free-tier cap or extract API credentials</li>
              <li>Resell, sublicense, or rebrand the service or its output as your own product</li>
            </ul>
            <p>
              We can refuse or terminate access to anyone at any time for any reason, and we may
              remove stories that violate these terms.
            </p>
          </Section>

          <Section title="Your content">
            <p>
              You retain ownership of the stories you create for your personal, non-commercial use
              — making books for your family, classroom, or close friends. We retain a license to
              host, display, and (with your opt-in) feature your story on our marketing surfaces.
              The wizard includes an explicit opt-in checkbox for the latter.
            </p>
          </Section>

          <Section title="AI output disclaimer">
            <p>
              AI-generated text and illustrations can contain errors, awkward phrasing, or visual
              quirks. Review every story before sharing it with a child. We do our best to filter
              for age-appropriateness but cannot guarantee perfection.
            </p>
          </Section>

          <Section title="Availability">
            <p>
              The service is provided <b>as-is</b> during the alpha. We do not guarantee uptime,
              feature stability, or that your stories will be retained indefinitely. We will give
              advance notice in the app before any breaking change to stored data.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, our total liability for any claim arising out
              of or related to the service is limited to the amount you paid us in the 12 months
              preceding the claim, or $20, whichever is greater.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These terms are governed by the laws of the State of California, USA. Disputes will
              be resolved in the courts of San Francisco County, California.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              We may update these terms as the product matures. The &ldquo;last updated&rdquo;
              date at the top reflects the most recent change. Continued use after a change means
              you accept the new terms.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Email{' '}
              <a href="mailto:hello@support.storybookstudio.org" className="text-brand-deep underline">
                hello@support.storybookstudio.org
              </a>{' '}
              with questions about these terms.
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="mt-3 text-ink-soft leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

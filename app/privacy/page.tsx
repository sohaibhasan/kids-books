import type { Metadata } from 'next'
import Header from '@/components/marketing/Header'
import Footer from '@/components/marketing/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy — Storybook Studio',
  description: 'How Storybook Studio handles your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <Header />
      <main className="flex-1">
        <article className="mx-auto max-w-2xl px-5 sm:px-8 py-16 md:py-24 prose-style">
          <p className="text-xs uppercase tracking-widest text-ink-muted font-numeral">
            Last updated: May 25, 2026
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mt-3">
            Privacy Policy
          </h1>
          <p className="mt-6 text-ink-soft">
            Storybook Studio (&ldquo;we&rdquo;, &ldquo;us&rdquo;) builds personalized illustrated
            storybooks. We try to collect as little as possible while still letting you make a book,
            pay for it, and come back to it later.
          </p>

          <Section title="Accounts">
            <p>
              We don&apos;t require an account to use the service. Everything below describes the
              limited data we still need to operate.
            </p>
          </Section>

          <Section title="Device identification">
            <p>
              We set a signed first-party cookie (<code>kb_device</code>) on your browser to track
              which device a story or credit belongs to. As a backup, we compute a hashed
              fingerprint from your IP address, user agent, and language header so clearing cookies
              on the same browser does not reset your free allowance. We do not store the raw IP or
              user agent — only the hash.
            </p>
          </Section>

          <Section title="Story content">
            <p>
              When you make a story we save the wizard inputs you provided (child&apos;s first
              name, age, pronouns, appearance fields you chose, genre, theme, art style, voice),
              the generated story text, and the generated illustrations. These are stored in
              Supabase (Postgres + object storage) on US infrastructure.
            </p>
            <p>
              Story prompts are sent to our AI providers to generate text and images: Anthropic
              (Claude, story text), OpenAI, Recraft, fal.ai, and Google (illustrations, routed per
              art style). Each provider has its own privacy practices; we send only what is needed
              to fulfill your request and do not allow training on your inputs where opt-out is
              available.
            </p>
          </Section>

          <Section title="Payments">
            <p>
              Payments are handled entirely by Stripe. We never see your card number. Stripe shares
              with us your email address (if you provide one at checkout), the pack you bought, and
              a session ID we use to grant credits and let you recover them on a different device.
            </p>
          </Section>

          <Section title="Email">
            <p>
              If you provide an email at checkout, we send one transactional email containing a
              one-time recovery link, via Resend. We do not send marketing email and do not share
              your address. The recovery link expires after 30 days.
            </p>
          </Section>

          <Section title="Analytics">
            <p>
              We use Vercel Analytics and Speed Insights to understand aggregate traffic and page
              performance. These tools do not use cookies and do not collect personal information.
            </p>
          </Section>

          <Section title="Children">
            <p>
              The service is intended for adults (parents, teachers, caregivers) to create stories
              for children. We do not knowingly collect personal information from children. The
              child&apos;s first name and age you enter become part of the story; we treat them as
              part of the story&apos;s content, not as a profile of the child.
            </p>
          </Section>

          <Section title="Retention and deletion">
            <p>
              We keep your story and credit ledger until you ask us to delete them. To request
              deletion, email{' '}
              <a href="mailto:hello@support.storybookstudio.org" className="text-brand-deep underline">
                hello@support.storybookstudio.org
              </a>{' '}
              with the story link or your purchase email and we will remove the associated rows
              from our database and storage.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              We will update this page when our practices change. The &ldquo;last updated&rdquo;
              date at the top reflects the most recent change. During the alpha, expect occasional
              revisions as the product evolves.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions? Email{' '}
              <a href="mailto:hello@support.storybookstudio.org" className="text-brand-deep underline">
                hello@support.storybookstudio.org
              </a>.
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

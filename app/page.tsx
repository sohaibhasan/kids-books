import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-16 text-center">

      {/* Hero */}
      <div className="mb-4 text-6xl">📖✨</div>
      <h1 className="text-5xl md:text-6xl font-bold text-accent mb-4 leading-tight"
          style={{ textShadow: '4px 4px 0 #e63946' }}>
        Storybook Studio
      </h1>
      <p className="text-xl md:text-2xl text-white mb-2 font-medium max-w-xl">
        Create a personalized illustrated storybook starring your child.
      </p>
      <p className="text-white/60 mb-10 text-base max-w-md">
        Pick a genre, a lesson, a world — and we'll generate a one-of-a-kind story with illustrations, ready to share.
      </p>

      {/* CTA */}
      <Link
        href="/wizard"
        className="inline-block bg-primary text-white text-xl font-bold px-10 py-4 rounded-2xl border-4 border-ink"
        style={{ boxShadow: '5px 5px 0 #ffd700' }}
      >
        🚀 Create a Story
      </Link>

      {/* Sample story link */}
      <p className="mt-8 text-white/50 text-sm">
        Want to see an example?{' '}
        <a
          href="https://sohaibhasan.github.io/kids-books/stories/aamilah-and-the-dragon-treasure/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          Read Aamilah and the Dragon's Treasure →
        </a>
      </p>
    </main>
  )
}

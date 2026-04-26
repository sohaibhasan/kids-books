export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-muted">
        <p>© {new Date().getFullYear()} Storybook Studio</p>
        <nav className="flex items-center gap-6">
          <a href="#" className="hover:text-ink transition-colors">Privacy</a>
          <a href="#" className="hover:text-ink transition-colors">Terms</a>
          <a
            href="https://github.com/sohaibhasan/kids-books"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}

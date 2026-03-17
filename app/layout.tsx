import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import './globals.css'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
})

export const metadata: Metadata = {
  title: 'Storybook Studio — Personalized Kids Books',
  description: 'Create custom illustrated storybooks personalized for your child.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

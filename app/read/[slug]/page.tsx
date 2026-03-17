import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import StoryReader from '@/components/reader/StoryReader'

interface StoryData {
  slug: string
  title: string
  pages: {
    page_number: number
    type?: string
    text_content: string
    scene_description: string
  }[]
  form: { child_name: string }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const storyPath = path.join(process.cwd(), 'public', 'generated', slug, 'story.json')
  if (!fs.existsSync(storyPath)) return { title: 'Story Not Found' }
  const story: StoryData = JSON.parse(fs.readFileSync(storyPath, 'utf-8'))
  return { title: `${story.title} — Storybook Studio` }
}

export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const storyPath = path.join(process.cwd(), 'public', 'generated', slug, 'story.json')

  if (!fs.existsSync(storyPath)) notFound()

  const story: StoryData = JSON.parse(fs.readFileSync(storyPath, 'utf-8'))

  // Attach image URLs (served from /generated/<slug>/page-XX.png)
  const pages = story.pages.map(p => ({
    ...p,
    illustration_url: `/generated/${slug}/page-${String(p.page_number).padStart(2, '0')}.png`,
  }))

  return <StoryReader title={story.title} pages={pages} slug={slug} />
}

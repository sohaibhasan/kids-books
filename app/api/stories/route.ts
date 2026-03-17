import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { generateStory } from '@/lib/ai/generate-story'
import { makeSlug } from '@/lib/utils/slug'
import { WizardFormData } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const form: WizardFormData = await req.json()

    if (!form.child_name?.trim()) {
      return NextResponse.json({ error: 'child_name is required' }, { status: 400 })
    }

    // Generate story text via Claude
    const story = await generateStory(form)
    const slug  = makeSlug(form.child_name)

    // Persist to public/generated/<slug>/story.json
    const dir = path.join(process.cwd(), 'public', 'generated', slug)
    fs.mkdirSync(dir, { recursive: true })

    const payload = {
      slug,
      title: story.title,
      form,
      pages: story.pages,
      created_at: new Date().toISOString(),
      images_done: false,
    }
    fs.writeFileSync(path.join(dir, 'story.json'), JSON.stringify(payload, null, 2))

    return NextResponse.json({ slug, title: story.title })
  } catch (err) {
    console.error('[POST /api/stories]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

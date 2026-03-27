import { NextRequest, NextResponse } from 'next/server'
import { generateStory } from '@/lib/ai/generate-story'
import { makeSlug } from '@/lib/utils/slug'
import { supabase } from '@/lib/supabase'
import { WizardFormData } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const form: WizardFormData = await req.json()

    if (!form.child_name?.trim()) {
      return NextResponse.json({ error: 'child_name is required' }, { status: 400 })
    }

    const story = await generateStory(form)
    const slug  = makeSlug(form.child_name)

    const { error } = await supabase.from('stories').insert({
      slug,
      title: story.title,
      form,
      pages: story.pages,
      images_done: false,
    })

    if (error) throw error

    return NextResponse.json({ slug, title: story.title })
  } catch (err) {
    console.error('[POST /api/stories]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

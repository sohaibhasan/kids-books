export type AgeTier = 'tiny' | 'early' | 'growing' | 'independent'
export type Genre = 'fantasy' | 'adventure' | 'sci-fi' | 'nature' | 'fairy-tale' | 'everyday' | 'mystery' | 'humor'
export type ArtStyle = 'comic-book' | 'classic-watercolor' | 'paper-collage' | 'whimsical-ink' | 'bold-modern' | 'soft-cozy' | 'anime-ghibli' | 'storybook-realism'
export type WritingStyle =
  | 'rhyming-playful'
  | 'gentle-pastoral'
  | 'deadpan-quirky'
  | 'lyrical-imaginative'
  | 'mischievous-bold'
  | 'warm-contemplative'
  | 'vocab-stretching'
  | 'sensory-repetitive'
export type Tone = 'silly' | 'heartfelt' | 'adventurous' | 'spooky-but-safe' | 'bittersweet' | 'hopeful'
export type DepthModifier = 'plot-twist' | 'sensory-rich' | 'vocab-stretch' | 'character-arc'
export type PageLayout = 'full-bleed' | 'text-left' | 'text-right' | 'text-overlay'
export type StoryStatus = 'draft' | 'generating' | 'published'

export interface Character {
  id: string
  story_id: string
  name: string
  role: 'protagonist' | 'supporting'
  appearance_description: string
  reference_image_url?: string
}

export interface Page {
  id: string
  story_id: string
  page_number: number
  text_content: string
  scene_description: string
  illustration_url?: string
  layout: PageLayout
}

export interface Story {
  id: string
  user_id?: string
  title: string
  share_slug: string
  genre: Genre
  theme: string
  lesson: string
  art_style: ArtStyle
  age_tier: AgeTier
  language: string
  status: StoryStatus
  pages?: Page[]
  characters?: Character[]
  created_at: string
  updated_at: string
}

export interface WizardFormData {
  // Step 1 - Child details
  child_name: string
  child_age: number
  child_pronouns: string
  // Structured appearance
  skin_tone: string
  hair_color: string
  hair_style: string
  eye_color: string
  outfit: string
  child_appearance: string  // freeform extras (glasses, freckles, etc.)
  // Step 2 - Story setup
  genre: Genre
  theme: string
  lesson: string
  setting: string
  supporting_characters: string
  companion_name: string
  // Step 3 - Style
  art_style: ArtStyle
  length: 'short' | 'medium' | 'long'
  // Step - Writing voice
  writing_style: WritingStyle
  tone: Tone
  depth_modifiers: DepthModifier[]
  // Image quality
  // Extras
  dedication?: string
  language: string
  // Showcase opt-in
  feature_opt_in?: boolean
  // Required delivery email. The finished book is produced in the background
  // and its link is emailed here, so the user can close the tab and walk away
  // instead of babysitting a live render that stalls if they navigate off.
  email: string
  // Step 7 - Your Ideas (optional user-injected story elements). All free-text
  // fields are treated as creative suggestions and woven in subordinate to
  // safety + the narrative arc — see lib/ai/generate-story.ts.
  custom_plot_points?: string     // a must-happen moment / plot beat
  custom_subjects?: string        // interests / subjects to feature
  custom_world_details?: string   // setting / world flourishes
  custom_special_object?: string  // a meaningful object to include
  surprise_me?: boolean           // let the author invent one extra delight
}

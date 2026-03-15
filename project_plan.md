# Custom Children's Storybook Platform — Product Plan

---

## 1. Vision

An interactive web app where parents, teachers, and caregivers can create personalized illustrated storybooks for children. Users customize characters, settings, themes, and life lessons — then receive a beautifully illustrated, page-by-page storybook they can click through, share via link, and optionally print.

---

## 2. Core User Experience

### 2.1 Story Creation Flow

The user journey from landing to finished story:

1. **Welcome screen** — Choose "Create a Story" or browse a gallery of sample stories.
2. **Story setup wizard** (step-by-step form):
   - **Child's details** — Name, age, pronouns, appearance (hair, skin, glasses, etc.) so the protagonist can look like _them_.
   - **Genre** — Fantasy, adventure, sci-fi, nature/animals, fairy tale, everyday life, mystery, humor.
   - **Theme & lesson** — Kindness, bravery, honesty, sharing, managing emotions, trying new things, inclusivity, environmental care, resilience, friendship, gratitude, etc.
   - **Setting** — Enchanted forest, outer space, underwater kingdom, neighborhood, school, farm, jungle, snowy mountains, or custom.
   - **Supporting characters** — Best friend, sibling, pet, magical creature, talking animal, wise elder.
   - **Tone & length** — Silly / heartfelt / adventurous; Short (5 pages), Medium (10 pages), Long (15 pages).
   - **Optional extras** — Dedication page, "The End" page with moral recap, bilingual text.
3. **Preview & edit** — User sees a storyboard draft with thumbnails. They can reorder pages, tweak text, regenerate individual illustrations, or swap scenes.
4. **Publish** — Generate a shareable link. Anyone with the link can click through the story in a beautiful reader view.

### 2.2 Reader Experience (Shared Link)

- Full-screen, book-like page turns (swipe or click arrows).
- Each spread shows one illustration + story text with large, readable type.
- Optional read-aloud narration (text-to-speech or pre-generated audio).
- Works on phones, tablets, and desktops.
- No login required to view.

---

## 3. Content Framework

### 3.1 Genre Library

| Genre | Description | Typical Settings | Example Hook |
|---|---|---|---|
| Fantasy | Magic, mythical creatures, quests | Enchanted forests, castles | "A dragon who's afraid of fire" |
| Adventure | Exploration, treasure, journeys | Jungles, mountains, islands | "A map that only appears at night" |
| Sci-Fi | Space, robots, future tech | Spaceships, alien planets | "A robot who wants to paint" |
| Nature & Animals | Wildlife, seasons, ecosystems | Forests, oceans, farms | "A bee who gets lost from the hive" |
| Fairy Tale | Classic archetypes, moral tales | Kingdoms, villages | "A princess who builds bridges" |
| Everyday Life | Realistic, relatable moments | School, home, playground | "First day at a new school" |
| Mystery | Puzzles, clues, problem-solving | Neighborhoods, libraries | "Who took the missing cookies?" |
| Humor | Silly, absurd, wordplay | Anywhere! | "A sock that escapes the laundry" |

### 3.2 Themes & Lessons Matrix

Each story embeds one primary lesson and optionally a secondary one:

| Category | Lessons |
|---|---|
| Emotional Intelligence | Managing anger, coping with fear, understanding sadness, expressing joy |
| Social Skills | Sharing, teamwork, making friends, resolving conflict, empathy |
| Character Virtues | Honesty, bravery, patience, gratitude, kindness, perseverance |
| Growth Mindset | Trying new things, learning from mistakes, asking for help, practice |
| World Awareness | Environmental care, cultural appreciation, inclusivity, community |

### 3.3 Age-Appropriate Tiers

| Tier | Ages | Vocabulary | Page Count | Sentence Complexity |
|---|---|---|---|---|
| Tiny Readers | 2–4 | Simple, repetitive phrasing | 5–8 pages | 1 sentence per page |
| Early Readers | 4–6 | Short sentences, familiar words | 8–12 pages | 2–3 sentences per page |
| Growing Readers | 6–9 | Richer vocabulary, dialogue | 10–15 pages | Short paragraphs |
| Independent Readers | 9–12 | Complex narrative, chapters | 15–20 pages | Full paragraphs |

---

## 4. Illustration System

### 4.1 Art Style Options

Offer users a choice of visual style that carries through every page:

- **Dog Man Comic Book** — Bold black outlines, flat bright colors, simple cartoonish shapes, hand-drawn comic feel inspired by Dav Pilkey. Default style.
- **Watercolor Storybook** — Soft, dreamy, classic picture-book feel.
- **Bold & Bright** — Flat colors, thick outlines, modern and playful.
- **Pencil Sketch** — Hand-drawn texture, warm and cozy.
- **Paper Cutout / Collage** — Layered shapes, tactile aesthetic.
- **Pixel Art** — Retro, game-inspired (popular with older kids).

### 4.2 Character Consistency

This is the hardest technical challenge. The plan:

1. **Character reference sheet** — Generate a front-facing and side-profile reference of the protagonist based on user inputs (hair color, skin tone, outfit, accessories).
2. **Style-locked generation** — Every subsequent illustration uses the reference sheet + scene description to keep the character recognizable.
3. **Fallback: silhouette / stylized approach** — If photorealistic consistency is too difficult, use a more stylized/abstract art style where minor variation is charming rather than jarring.

### 4.3 Illustration Pipeline

For each page:

1. Story text is finalized.
2. A **scene description prompt** is auto-generated from the text (setting, characters present, action, mood, time of day).
3. The illustration is generated via the Google Gemini API (free tier).
4. User can **regenerate**, **adjust** (e.g., "make it nighttime"), or **upload their own** drawing.

---

## 5. Storyboard Editor

### 5.1 Layout

A drag-and-drop storyboard where each card represents a page:

```
[ Cover ] [ Page 1 ] [ Page 2 ] [ Page 3 ] ... [ The End ]
```

Each card shows:
- Thumbnail of the illustration
- First line of text
- Page number
- Action buttons: Edit text · Regenerate image · Delete · Reorder

### 5.2 Editing Capabilities

- **Text editing** — Inline rich-text editor for each page. Adjust wording, add dialogue, fix names.
- **Image swapping** — Regenerate with a new prompt, upload a custom image, or choose from 3 generated variants.
- **Page management** — Add blank pages, duplicate a page, delete, drag to reorder.
- **Global controls** — Change art style (re-renders all images), adjust reading level, switch language.

---

## 6. Technical Architecture

### 6.1 Stack Recommendation

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (React) + Tailwind CSS | Fast, SEO-friendly, great for page-based navigation |
| Animation | Framer Motion or react-spring | Smooth page-turn transitions |
| State Management | Zustand or React Context | Lightweight, sufficient for wizard + editor state |
| Backend / API | Next.js API routes or a separate Node/Python service | Handles story generation, image generation calls |
| AI Story Generation | Anthropic Claude API (or OpenAI) | Generates age-appropriate narrative text |
| AI Image Generation | Google Gemini API (free tier) | Generates illustrations from scene prompts; free tier reduces cost to zero at MVP stage |
| Database | PostgreSQL (via Supabase or PlanetScale) | Stores stories, user accounts, image URLs |
| File Storage | AWS S3 or Cloudflare R2 | Stores generated images |
| Auth | Clerk, NextAuth, or Supabase Auth | User accounts (optional for creators, not needed for readers) |
| Hosting | Vercel or Cloudflare Pages | Easy deploy, edge-optimized |

### 6.2 Data Model (Simplified)

```
User
  ├── id, email, name, created_at

Story
  ├── id, user_id, title, genre, theme, lesson
  ├── art_style, age_tier, language
  ├── share_slug (unique URL identifier)
  ├── status (draft / published)
  ├── created_at, updated_at

Page
  ├── id, story_id, page_number
  ├── text_content
  ├── illustration_url
  ├── scene_description (prompt used for image gen)
  ├── layout (full-bleed, text-left, text-right, text-overlay)

Character
  ├── id, story_id, name, role (protagonist / supporting)
  ├── appearance_description
  ├── reference_image_url
```

### 6.3 Key API Endpoints

```
POST   /api/stories              → Create a new story (from wizard inputs)
GET    /api/stories/:id          → Fetch full story with pages
PATCH  /api/stories/:id          → Update story metadata
DELETE /api/stories/:id          → Delete a story

POST   /api/stories/:id/generate → Trigger AI story + illustration generation
PATCH  /api/pages/:id            → Edit a single page (text or image)
POST   /api/pages/:id/regenerate → Regenerate illustration for a page

GET    /api/read/:slug           → Public reader endpoint (no auth)
```

---

## 7. Reader View (The Shareable Link)

### 7.1 URL Structure

```
https://yourdomain.com/read/luna-and-the-starfish-a3f9x2
```

### 7.2 Reader Features

- **Book mode** — Full-screen, page-by-page. Left/right arrows or swipe.
- **Auto-play** — Optional timed auto-advance (great for bedtime on a tablet).
- **Read-aloud** — Browser TTS or pre-generated narration audio per page.
- **Night mode** — Dimmed background, reduced blue light for bedtime reading.
- **Progress indicator** — Subtle dots or a thin bar showing page position.
- **End screen** — "The End" page with the moral, a "Read Again" button, and "Create Your Own Story" CTA.

### 7.3 Responsive Design

| Device | Layout |
|---|---|
| Desktop | Two-page spread (illustration left, text right) |
| Tablet | Single page, large illustration above text |
| Phone | Single page, stacked vertically, swipe to advance |

---

## 8. Monetization Options (Future)

| Model | Description |
|---|---|
| Freemium | 1–2 free stories, then subscription for unlimited |
| Per-story pricing | $2–5 per generated story |
| Subscription | $9.99/mo for unlimited stories + premium art styles |
| Print-on-demand | Integration with a print service to order a physical book ($15–25) |
| Classroom license | Bulk pricing for teachers (30 students, unlimited stories) |

---

## 9. Development Phases

### Phase 1 — MVP (Weeks 1–4)
- Story creation wizard (basic: name, genre, theme, length)
- AI story text generation (Claude API)
- AI illustration generation (one art style)
- Simple page-by-page reader view
- Shareable link
- Deploy on Vercel

### Phase 2 — Polish (Weeks 5–8)
- Storyboard editor (reorder, edit text, regenerate images)
- Multiple art styles
- Character customization (appearance inputs)
- Read-aloud (browser TTS)
- Night mode

### Phase 3 — Growth (Weeks 9–12)
- User accounts and story library ("My Stories")
- Gallery of public/sample stories
- Age-tier vocabulary control
- Bilingual support (English + Spanish to start)
- Mobile-optimized reader

### Phase 4 — Monetization & Scale (Months 4–6)
- Payment integration (Stripe)
- Subscription plans
- Print-on-demand integration
- Classroom/teacher accounts
- Analytics dashboard

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Character consistency across pages** | Use style-locked reference sheets; fall back to stylized/abstract art styles that tolerate variation |
| **Inappropriate AI-generated content** | Content safety filters on both text and image generation; curated prompt templates; human review queue |
| **Slow generation times** | Show progress indicators; generate pages in parallel; cache common elements |
| **Image generation rate limits** | Gemini free tier has per-minute limits; generate pages sequentially with a queue; upgrade to paid tier when usage scales |
| **Copyright / IP concerns** | Avoid generating content resembling existing children's book characters; add content policy; use original prompts |

---

## 11. Success Metrics

- **Stories created** per week
- **Completion rate** — % of users who finish the wizard and generate a story
- **Share rate** — % of stories that get their link opened by someone else
- **Reader engagement** — % of readers who click through all pages
- **Return rate** — % of creators who come back to make a second story
- **NPS** — Net promoter score from post-creation survey

---

## 12. Next Steps

1. **Validate the concept** — Build a single-page prototype that generates one story and displays it in a reader. Share with 10 parents/teachers for feedback.
2. **Lock the AI stack** — Test Claude for story generation and 2–3 image APIs for illustration quality and consistency.
3. **Design the wizard UI** — Wireframe the step-by-step creation flow in Figma.
4. **Build the MVP** — Focus on the happy path: one genre, one art style, one age tier.
5. **User test** — Get the MVP in front of real families and iterate.
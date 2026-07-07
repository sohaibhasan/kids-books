# Custom Children's Storybook Platform — Vision Document

**Original vision document.** For current state and architecture, see `CLAUDE.md`. For the live prioritized backlog, see `docs/TASKS.md`.

---

## Vision

An interactive web app where parents, teachers, and caregivers create personalized illustrated storybooks for children. Users customize characters, settings, themes, and life lessons — then receive a beautifully illustrated, page-by-page storybook they can click through, share via link, and optionally print.

---

## Unbuilt Features (Roadmap)

### Storyboard Editor (Phase 2b)

A drag-and-drop interface for editing stories after generation:

- **Layout:** Horizontal card-based storyboard showing each page with thumbnail, first line of text, and page number.
- **Editing:** Inline text editing per page, image regeneration with new prompts, add/duplicate/delete/reorder pages.
- **Global controls:** Change art style (re-render all images), adjust reading level, modify writing voice/tone/depth modifiers.

### Reader Enhancements

- **Auto-play:** Timed auto-advance (great for tablets / bedtime reading); toggleable.
- **Read-aloud:** Web Speech API or pre-generated audio narration; auto-advance on utterance end; iOS-compatible gesture start.
- **Night mode:** Dimmed cream → dark palette swap; sun/moon toggle in reader chrome; persisted to localStorage.
- **Print/PDF:** Clean print stylesheet or dedicated render page (one page per sheet, no chrome, images intact).

### Content & Presentation

- **Narrative structure presets:** "Hero's journey," "three-act," "problem-solution," "day-in-the-life" — optional templates that guide Claude's story structure.
- **POV (Point-of-View) selector:** First-person ("I"), third-person ("The character"), or interactive ("You are the character").
- **Bilingual output:** Dual-language stories (English + Spanish, French, Mandarin, etc.); toggle language on reader.
- **Featured gallery:** `/gallery` surfacing curated stories from `lib/featured-stories.ts`.

### Monetization & Business

- **Subscriptions:** Unlimited stories for $9.99/mo (vs. current per-pack credits).
- **Print-on-demand:** Partner with a print service; order physical books ($15–25).
- **Classroom accounts:** Bulk licensing for teachers (30+ students, unlimited stories).
- **Optional user accounts:** Preserve user identity across devices/browsers; full story library; revision history (only if needed for paid features).

---

## Product Philosophy

Stories are most memorable when they mirror the reader. We embed the protagonist's name, appearance, and personality into every page illustration and text, so the child sees themselves as the hero. This deep personalization drives engagement and return-use.

We keep the creation experience frictionless — 7-step wizard, no signup, immediate gratification (story in 2–3 minutes). Monetization is simple: one free story per device, then small credit packs. Print-on-demand and classroom licensing extend value for educators and gift-givers.

---

## Success Metrics

- Stories created per week
- Wizard completion rate (% who start and finish)
- Share rate (% of stories that get their link opened by someone else)
- Reader engagement (% who click through all pages)
- Returning creator rate (% who generate a second story)
- Net promoter score (NPS) from post-creation survey
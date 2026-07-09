'use client'

import { useSyncExternalStore } from 'react'

export type ReaderTheme = 'night' | 'day'

const STORAGE_KEY = 'kb_reader_theme'
const DEFAULT: ReaderTheme = 'night'

// Module-level emitter: notifies in-tab subscribers when toggle() fires.
// Storage events do NOT fire in the tab that wrote, so we need this local
// channel in addition to the native storage event.
const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((fn) => fn())
}

function readTheme(): ReaderTheme {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (val === 'night' || val === 'day') return val
  } catch {
    // private browsing or SSR guard
  }
  return DEFAULT
}

function writeTheme(theme: ReaderTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // quota / private browsing — ignore
  }
  notify()
}

function subscribeTheme(onChange: () => void): () => void {
  listeners.add(onChange)
  // Cross-tab sync via the native storage event.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onStorage)
  }
}

// Both snapshots return primitives (strings), which are referentially stable
// between calls — no memoisation wrapper needed.
function getThemeSnapshot(): ReaderTheme {
  return readTheme()
}

function getThemeServerSnapshot(): ReaderTheme {
  return DEFAULT
}

export function useReaderTheme(): { theme: ReaderTheme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot)
  const toggle = () => writeTheme(theme === 'night' ? 'day' : 'night')
  return { theme, toggle }
}

export function glassPillClasses(theme: ReaderTheme): string {
  return theme === 'night'
    ? 'bg-white/12 backdrop-blur-md text-white/90 hover:bg-white/20'
    : 'bg-black/8 backdrop-blur-md text-ink hover:bg-black/15'
}

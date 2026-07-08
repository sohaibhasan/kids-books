'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

export interface UseReadAloud {
  supported: boolean
  speaking: boolean
  paused: boolean
  speak: (text: string, onEnd?: () => void) => void
  stop: () => void
  toggle: (text: string, onEnd?: () => void) => void
}

/**
 * Thin wrapper around window.speechSynthesis.
 *
 * iOS note: the first speak() call MUST originate inside a user gesture
 * (tap/click). Because this hook is driven by a button tap in ReaderNav,
 * that requirement is naturally satisfied.
 */
const noopSubscribe = () => () => {}

export function useReadAloud(): UseReadAloud {
  // SSR renders unsupported (server snapshot false); the client snapshot
  // upgrades to true after hydration without a setState-in-effect.
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => 'speechSynthesis' in window,
    () => false,
  )
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)

  // Voices load asynchronously; keep a ref so speak() always sees the latest list.
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    // Chrome fires voiceschanged once voices are available; Safari populates
    // getVoices() synchronously so the loadVoices() call above is sufficient.
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      // Always cancel any in-progress utterance on unmount to prevent orphaned speech.
      window.speechSynthesis.cancel()
    }
  }, [])

  /** Pick the best available 'en' voice; fall back to whatever is first. */
  const pickVoice = (): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current
    return (
      voices.find((v) => v.lang.startsWith('en') && v.localService) ??
      voices.find((v) => v.lang.startsWith('en')) ??
      voices[0] ??
      null
    )
  }

  /**
   * Cancel any current utterance and begin speaking `text`.
   * `onEnd` fires when the utterance finishes naturally (not when cancelled).
   */
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    const voice = pickVoice()
    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      setSpeaking(true)
      setPaused(false)
    }
    utterance.onend = () => {
      setSpeaking(false)
      setPaused(false)
      onEnd?.()
    }
    utterance.onerror = (e) => {
      // 'canceled'/'interrupted' fire whenever cancel() is called
      // intentionally; treat everything as terminal for the speaking state.
      const code = (e as SpeechSynthesisErrorEvent).error
      if (code !== 'canceled' && code !== 'interrupted') {
        setSpeaking(false)
        setPaused(false)
      }
    }

    window.speechSynthesis.speak(utterance)
    // Optimistically set speaking=true; onstart may arrive on the next tick.
    setSpeaking(true)
    setPaused(false)
  }, [])

  /** Cancel any in-progress speech and reset state. */
  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }, [])

  /** If currently speaking, stop. Otherwise, start speaking `text`. */
  const toggle = useCallback(
    (text: string, onEnd?: () => void) => {
      if (speaking) {
        stop()
      } else {
        speak(text, onEnd)
      }
    },
    [speaking, speak, stop],
  )

  return { supported, speaking, paused, speak, stop, toggle }
}

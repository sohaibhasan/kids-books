'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

// Root — controlled via open/onOpenChange
export const Dialog = DialogPrimitive.Root

// Close — re-exported so consumers can wire their own close button;
// Radix automatically calls onOpenChange(false) when this is clicked.
export const DialogClose = DialogPrimitive.Close

// Overlay — backdrop, not exported (always rendered by DialogContent below)
function DialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
        // Data-state classes match the Toast.tsx convention in this repo.
        // Radix waits for the CSS animation to finish before unmounting, so
        // if tailwindcss-animate is ever added, exit animations will work
        // automatically without touching this file.
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        'duration-200',
        className,
      )}
      {...props}
    />
  )
}

// DialogContent — Portal + Overlay + Content.
// The Radix Content element provides the focus-trap, scroll-lock, Esc-to-close,
// and focus-return for free. A framer-motion div inside it handles the spring
// entrance animation (matching the "render motion.div inside Content" pattern
// described in the task). The className prop is forwarded to the motion div
// so consumers can add padding, extra spacing, etc.
export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        // Radix Content: positioning only. Background/shadow/rounded are on the
        // motion.div so the spring animation scales the visual box, not just
        // the content inside it.
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md outline-none"
        {...props}
      >
        <motion.div
          // Visual dialog box. mx-4 sm:mx-0 gives 16px screen edge padding on
          // mobile (matching the original overlay's p-4 outer container).
          className={cn(
            'relative bg-surface-raised rounded-xl shadow-xl mx-4 sm:mx-0',
            className,
          )}
          initial={{ y: 24, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {children}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

// DialogTitle — wired to aria-labelledby on DialogContent by Radix internally.
// Default styling matches PaywallModal's heading; override via className.
export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-display text-2xl sm:text-3xl text-ink', className)}
      {...props}
    />
  )
}

// DialogDescription — wired to aria-describedby on DialogContent by Radix.
export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-ink-soft text-sm', className)}
      {...props}
    />
  )
}

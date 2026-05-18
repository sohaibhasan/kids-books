import { supabase } from './supabase'

export type Entitlement =
  | { kind: 'free'; balance: 0 }
  | { kind: 'paid'; balance: number }
  | { kind: 'none'; balance: 0 }

export const PACKS: Record<string, { credits: number; priceEnv: string; label: string; price: string }> = {
  solo:  { credits: 1,  priceEnv: 'STRIPE_PRICE_PACK_1',  label: '1 story',    price: '$3.50' },
  small: { credits: 3,  priceEnv: 'STRIPE_PRICE_PACK_3',  label: '3 stories',  price: '$10'   },
  large: { credits: 10, priceEnv: 'STRIPE_PRICE_PACK_10', label: '10 stories', price: '$25'   },
}

const FREE_GLOBAL_DAILY = Number(process.env.FREE_STORIES_PER_DAY_GLOBAL ?? 200)

/**
 * Has this device (or its fallback hash) used its free allowance?
 * "Used" means: a story that either completed (`images_done = true`) OR was
 * started within the last 10 minutes (the recency window prevents spam-retry
 * abuse while still letting a user re-try after a real failure ages out).
 */
async function hasUsedFree(deviceId: string, fallbackHash: string): Promise<boolean> {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count, error } = await supabase
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .or(`device_id.eq.${deviceId},fallback_hash.eq.${fallbackHash}`)
    .or(`images_done.eq.true,created_at.gte.${tenMinAgo}`)
  if (error) throw error
  return (count ?? 0) > 0
}

async function balanceFor(deviceId: string): Promise<number> {
  const { data, error } = await supabase
    .from('credit_events')
    .select('delta')
    .eq('device_id', deviceId)
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + (row.delta as number), 0)
}

async function countFreeStoriesToday(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await supabase
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .is('credit_event_id', null)
    .gte('created_at', since)
  if (error) throw error
  return count ?? 0
}

export async function getEntitlement(deviceId: string, fallbackHash: string): Promise<Entitlement> {
  const balance = await balanceFor(deviceId)
  if (balance > 0) return { kind: 'paid', balance }
  const usedFree = await hasUsedFree(deviceId, fallbackHash)
  if (!usedFree) return { kind: 'free', balance: 0 }
  return { kind: 'none', balance: 0 }
}

export async function isGloballyThrottled(): Promise<boolean> {
  if (!Number.isFinite(FREE_GLOBAL_DAILY) || FREE_GLOBAL_DAILY <= 0) return false
  const used = await countFreeStoriesToday()
  return used >= FREE_GLOBAL_DAILY
}

/** On a successful generation: if paid, write a -1 ledger event and return its id. */
export async function consumeOne(
  deviceId: string,
  kind: 'free' | 'paid',
  storySlug: string,
): Promise<string | null> {
  if (kind === 'free') return null
  const { data, error } = await supabase
    .from('credit_events')
    .insert({ device_id: deviceId, delta: -1, reason: 'consume', story_slug: storySlug })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

/**
 * Refund a paid story whose image generation failed. Writes a compensating
 * +1 credit_event so the user is whole. Idempotent: if a refund already
 * exists for this slug, returns { refunded: false } without writing.
 */
export async function refundFailedGen(deviceId: string, storySlug: string): Promise<{ refunded: boolean }> {
  const { data: existing } = await supabase
    .from('credit_events')
    .select('id')
    .eq('story_slug', storySlug)
    .eq('reason', 'refund_failed_gen')
    .maybeSingle()
  if (existing) return { refunded: false }

  const { error } = await supabase.from('credit_events').insert({
    device_id: deviceId,
    delta: 1,
    reason: 'refund_failed_gen',
    story_slug: storySlug,
  })
  if (error) throw error
  return { refunded: true }
}

/** Idempotent: unique(stripe_session) prevents duplicate grants on webhook replay. */
export async function grant(opts: {
  deviceId: string
  credits: number
  stripeSession: string
  email: string | null
}): Promise<{ granted: boolean }> {
  const { error } = await supabase.from('credit_events').insert({
    device_id: opts.deviceId,
    delta: opts.credits,
    reason: 'purchase',
    stripe_session: opts.stripeSession,
    email: opts.email,
  })
  if (error) {
    // Unique violation on stripe_session = already processed; treat as success.
    if ((error as { code?: string }).code === '23505') return { granted: false }
    throw error
  }
  return { granted: true }
}

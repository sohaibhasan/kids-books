import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { cookies, headers } from 'next/headers'

const COOKIE = 'kb_device'
const TWO_YEARS = 60 * 60 * 24 * 365 * 2

function secret(): string {
  const s = process.env.DEVICE_COOKIE_SECRET
  if (!s) throw new Error('DEVICE_COOKIE_SECRET is not set')
  return s
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

function verify(value: string, sig: string): boolean {
  const expected = Buffer.from(sign(value))
  const actual = Buffer.from(sig)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/**
 * Read or mint the signed device-id cookie. Cookie format: `<uuid>.<sig>`.
 * Returns `{ deviceId, isNew }`. Caller must be in a Route Handler / Server Action.
 */
export async function getOrSetDeviceId(): Promise<{ deviceId: string; isNew: boolean }> {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (raw) {
    const [id, sig] = raw.split('.')
    if (id && sig && verify(id, sig)) return { deviceId: id, isNew: false }
  }
  const id = randomUUID()
  jar.set(COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TWO_YEARS,
  })
  return { deviceId: id, isNew: true }
}

/**
 * Read the signed device-id cookie WITHOUT minting or setting one. Returns the
 * id when a validly-signed cookie is present, else null. Safe to call during a
 * Server Component render (never mutates the cookie jar — unlike
 * getOrSetDeviceId, which sets a cookie and must only run in a Route Handler /
 * Server Action). Reuses the same verify() logic as getOrSetDeviceId.
 */
export async function getDeviceIdIfPresent(): Promise<string | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (!raw) return null
  const [id, sig] = raw.split('.')
  if (id && sig && verify(id, sig)) return id
  return null
}

/** Force-set the device-id cookie (used by the magic-link claim flow). */
export async function setDeviceIdCookie(deviceId: string): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE, `${deviceId}.${sign(deviceId)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TWO_YEARS,
  })
}

/** sha256(ip + ua + accept-language) — secondary signal to catch casual incognito reuse. */
export async function getFallbackHash(): Promise<string> {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const ua = h.get('user-agent') ?? 'unknown'
  const lang = h.get('accept-language') ?? 'unknown'
  return createHash('sha256').update(`${ip}|${ua}|${lang}`).digest('hex').slice(0, 32)
}

export function newRandomToken(): string {
  return randomBytes(32).toString('base64url')
}

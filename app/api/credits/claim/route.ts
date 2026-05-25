import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { setDeviceIdCookie } from '@/lib/identity'
import { appUrl as resolveAppUrl } from '@/lib/app-url'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const appUrl = resolveAppUrl(req)

  if (!token) {
    return NextResponse.redirect(`${appUrl}/wizard?reclaim=missing`)
  }

  const { data, error } = await supabase
    .from('credit_claim_tokens')
    .select('source_device, expires_at, consumed_at')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.redirect(`${appUrl}/wizard?reclaim=invalid`)
  }
  if (data.consumed_at) {
    return NextResponse.redirect(`${appUrl}/wizard?reclaim=used`)
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(`${appUrl}/wizard?reclaim=expired`)
  }

  // Atomically claim the token. If a concurrent request already consumed it
  // between the SELECT above and this UPDATE, .select().maybeSingle() returns
  // null and we treat it as already-used rather than re-binding the cookie.
  const { data: updated, error: updateErr } = await supabase
    .from('credit_claim_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', token)
    .is('consumed_at', null)
    .select('token')
    .maybeSingle()

  if (updateErr) {
    console.error('[claim] update error', updateErr)
    return NextResponse.redirect(`${appUrl}/wizard?reclaim=error`)
  }
  if (!updated) {
    return NextResponse.redirect(`${appUrl}/wizard?reclaim=used`)
  }

  await setDeviceIdCookie(data.source_device)
  return NextResponse.redirect(`${appUrl}/wizard?reclaimed=1`)
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { setDeviceIdCookie } from '@/lib/identity'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const appUrl = process.env.APP_URL ?? new URL(req.url).origin

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

  const { error: updateErr } = await supabase
    .from('credit_claim_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', token)
    .is('consumed_at', null)

  if (updateErr) {
    console.error('[claim] update error', updateErr)
    return NextResponse.redirect(`${appUrl}/wizard?reclaim=error`)
  }

  await setDeviceIdCookie(data.source_device)
  return NextResponse.redirect(`${appUrl}/wizard?reclaimed=1`)
}

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: expiredUsers, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .in('subscription_status', ['active', 'cancelled'])
    .lt('plan_expires_at', new Date().toISOString())

  if (fetchError) {
    console.error('expire-subscriptions: fetch error', fetchError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  if (!expiredUsers || expiredUsers.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No expired subscriptions found.' })
  }

  const ids = expiredUsers.map((u) => u.id)

  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan_id: 1,
      subscription_status: 'none',
      billing_cycle: null,
      plan_expires_at: null,
    })
    .in('id', ids)

  if (updateError) {
    console.error('expire-subscriptions: update error', updateError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({
    processed: ids.length,
    message: `${ids.length} suscripción(es) expirada(s) bajada(s) a Free.`,
  })
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('subscription_status, plan_expires_at')
    .eq('id', user.id)
    .single()

  if (fetchError || !userData) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }

  if (userData.subscription_status !== 'active') {
    return NextResponse.json(
      { error: 'No tienes una suscripción activa para cancelar.' },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ subscription_status: 'cancelled' })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    plan_expires_at: userData.plan_expires_at,
  })
}

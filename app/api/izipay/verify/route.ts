import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { krAnswer, krHash, plan_id, billing_cycle } = await request.json()

    if (!krAnswer || !krHash || !plan_id || !billing_cycle) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (billing_cycle !== 'monthly' && billing_cycle !== 'annual') {
      return NextResponse.json({ error: 'Ciclo de facturación no válido' }, { status: 400 })
    }

    // Verificar firma HMAC
    const hmacKey = process.env.IZIPAY_HMAC_KEY!
    const expectedHash = crypto
      .createHmac('sha256', hmacKey)
      .update(krAnswer)
      .digest('hex')

    if (expectedHash !== krHash) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
    }

    const answer = JSON.parse(krAnswer)

    if (answer.orderStatus !== 'PAID') {
      return NextResponse.json({ error: 'El pago no fue completado' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const now = new Date()
    const expiresAt =
      billing_cycle === 'annual'
        ? new Date(
            Date.UTC(
              now.getUTCFullYear() + 1,
              now.getUTCMonth(),
              now.getUTCDate(),
              now.getUTCHours(),
              now.getUTCMinutes(),
              now.getUTCSeconds()
            )
          )
        : new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth() + 1,
              now.getUTCDate(),
              now.getUTCHours(),
              now.getUTCMinutes(),
              now.getUTCSeconds()
            )
          )

    const { error: dbError } = await supabase
      .from('users')
      .update({
        plan_id,
        subscription_status: 'active',
        billing_cycle,
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id)

    if (dbError) {
      return NextResponse.json(
        { error: 'Pago procesado pero error al actualizar plan. Contacte soporte.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

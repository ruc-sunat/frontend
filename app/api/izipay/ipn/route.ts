// IPN (Instant Payment Notification) — llamado server-to-server por Izipay
// No requiere sesión de usuario. Verifica HMAC y actualiza el plan en Supabase.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function restoreUUID(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? ''
    let krAnswer: string
    let krHash: string

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      const params = new URLSearchParams(text)
      krAnswer = params.get('kr-answer') ?? ''
      krHash = params.get('kr-hash') ?? ''
    } else {
      const body = await request.json()
      krAnswer = body['kr-answer'] ?? ''
      krHash = body['kr-hash'] ?? ''
    }

    if (!krAnswer || !krHash) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verificar firma HMAC
    const hmacKey = process.env.IZIPAY_HMAC_KEY!
    const expectedHash = crypto.createHmac('sha256', hmacKey).update(krAnswer).digest('hex')
    if (expectedHash !== krHash) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
    }

    const answer = JSON.parse(krAnswer)

    if (answer.orderStatus !== 'PAID') {
      // Pago no completado — no es un error, solo ignoramos
      return NextResponse.json({ received: true })
    }

    // Parsear orderId: ruc-{planId}-{cycleChar}-{userIdHex}
    const orderId: string = answer.orderDetails?.orderId ?? ''
    const parts = orderId.split('-')
    if (parts.length < 4 || parts[0] !== 'ruc') {
      return NextResponse.json({ error: 'orderId no reconocido' }, { status: 400 })
    }

    const plan_id = parseInt(parts[1], 10)
    const billing_cycle = parts[2] === 'a' ? 'annual' : 'monthly'
    const userIdHex = parts[3]

    if (!plan_id || userIdHex.length !== 32) {
      return NextResponse.json({ error: 'orderId malformado' }, { status: 400 })
    }

    const userId = restoreUUID(userIdHex)

    const now = new Date()
    const expiresAt =
      billing_cycle === 'annual'
        ? new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate()))
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()))

    // Usar service role para escribir sin sesión de usuario
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('users')
      .update({
        plan_id,
        subscription_status: 'active',
        billing_cycle,
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('IPN: error actualizando plan:', error.message)
      return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('IPN error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

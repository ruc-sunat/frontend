// IPN (Instant Payment Notification) — llamado server-to-server por Izipay
// No requiere sesión de usuario. Verifica HMAC y actualiza el plan en Supabase.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function restoreUUID(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ipn: event, ts: new Date().toISOString(), ...data }))
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '(none)'
    const hmacKey = process.env.IZIPAY_HMAC_KEY ?? ''
    log('request_received', {
      contentType,
      hmacKeyPresent: !!hmacKey,
      hmacKeyPrefix: hmacKey.slice(0, 4) || '(empty)',
    })

    const rawBody = await request.text()
    log('body_received', { bodyLength: rawBody.length, bodyPreview: rawBody.slice(0, 80) })

    let krAnswer: string
    let krHash: string

    // Intentar form-urlencoded primero (spec de Izipay IPN), JSON como fallback
    const params = new URLSearchParams(rawBody)
    if (params.has('kr-answer')) {
      krAnswer = params.get('kr-answer') ?? ''
      krHash = params.get('kr-hash') ?? ''
      log('parsed_as', { format: 'form-urlencoded' })
    } else {
      try {
        const body = JSON.parse(rawBody)
        krAnswer = body['kr-answer'] ?? ''
        krHash = body['kr-hash'] ?? ''
        log('parsed_as', { format: 'json' })
      } catch {
        log('parse_failed', { rawBodyPreview: rawBody.slice(0, 120) })
        return NextResponse.json({ error_code: 'PARSE_ERROR', error: 'Cuerpo ilegible' }, { status: 400 })
      }
    }

    if (!krAnswer || !krHash) {
      log('missing_params', { hasKrAnswer: !!krAnswer, hasKrHash: !!krHash })
      return NextResponse.json({ error_code: 'MISSING_PARAMS', error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verificar firma HMAC
    const expectedHash = crypto.createHmac('sha256', hmacKey).update(krAnswer).digest('hex')
    log('hmac_check', {
      expectedPrefix: expectedHash.slice(0, 8),
      receivedPrefix: krHash.slice(0, 8),
      match: expectedHash === krHash,
    })
    if (expectedHash !== krHash) {
      return NextResponse.json({ error_code: 'HMAC_MISMATCH', error: 'Firma inválida' }, { status: 400 })
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
      log('orderid_format_error', { orderId, partsCount: parts.length, firstPart: parts[0] })
      return NextResponse.json({ error_code: 'ORDERID_FORMAT', error: 'orderId no reconocido' }, { status: 400 })
    }

    const plan_id = parseInt(parts[1], 10)
    const billing_cycle = parts[2] === 'a' ? 'annual' : 'monthly'
    const userIdHex = parts[3]

    if (!plan_id || userIdHex.length !== 32) {
      log('orderid_malformed', { plan_id, userIdHexLength: userIdHex.length })
      return NextResponse.json({ error_code: 'ORDERID_MALFORMED', error: 'orderId malformado' }, { status: 400 })
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

    log('ipn_processed', { userId, plan_id, billing_cycle, expiresAt: expiresAt.toISOString() })
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('IPN error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

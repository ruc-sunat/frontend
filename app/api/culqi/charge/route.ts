import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLAN_AMOUNTS: Record<number, number> = {
  2: 900,   // $9.00 en centavos
  3: 2900,  // $29.00 en centavos
}

export async function POST(request: NextRequest) {
  try {
    const { token_culqi, plan_id } = await request.json()

    if (!token_culqi || !plan_id) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const amount = PLAN_AMOUNTS[plan_id]
    if (!amount) {
      return NextResponse.json({ error: 'Plan no válido para cobro' }, { status: 400 })
    }

    // Verificar sesión
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Crear cargo en Culqi
    const culqiRes = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CULQI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency_code: 'USD',
        email: user.email,
        source_id: token_culqi,
        description: `RUC-Sunat API — Plan upgrade`,
      }),
    })

    const culqiData = await culqiRes.json()

    if (!culqiRes.ok || culqiData.object === 'error') {
      const msg = culqiData.user_message ?? culqiData.merchant_message ?? 'Error al procesar el pago'
      return NextResponse.json({ error: msg }, { status: 402 })
    }

    // Actualizar plan en Supabase
    const { error: dbError } = await supabase
      .from('users')
      .update({ plan_id })
      .eq('id', user.id)

    if (dbError) {
      return NextResponse.json({ error: 'Pago procesado pero error al actualizar plan. Contacte soporte.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

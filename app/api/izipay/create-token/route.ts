import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLAN_AMOUNTS: Record<number, Record<string, number>> = {
  2: { monthly: 3500,   annual: 35000  },  // S/.35/mes o S/.350/año
  3: { monthly: 10900,  annual: 109000 },  // S/.109/mes o S/.1,090/año
}

export async function POST(request: NextRequest) {
  try {
    const { plan_id, billing_cycle } = await request.json()

    if (billing_cycle !== 'monthly' && billing_cycle !== 'annual') {
      return NextResponse.json({ error: 'Ciclo de facturación no válido' }, { status: 400 })
    }

    const amount = PLAN_AMOUNTS[plan_id]?.[billing_cycle]
    if (!amount) {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const shopId = process.env.IZIPAY_SHOP_ID!
    const password = process.env.IZIPAY_PASSWORD!
    const credentials = Buffer.from(`${shopId}:${password}`).toString('base64')

    const res = await fetch('https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'PEN',
        orderId: `ruc-${user.id.slice(0, 8)}-${billing_cycle[0]}-${Date.now()}`,
        customer: { email: user.email },
      }),
    })

    const data = await res.json()

    if (data.status !== 'SUCCESS') {
      console.error('Izipay error:', JSON.stringify(data, null, 2))
      const msg = data.answer?.errorMessage ?? data.answer?.detailedErrorMessage ?? JSON.stringify(data.answer)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ formToken: data.answer.formToken })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

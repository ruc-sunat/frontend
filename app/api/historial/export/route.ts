import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TIPO_LABELS: Record<string, string> = {
  ruc:           'RUC',
  dni:           'DNI',
  ruc_batch:     'RUC (lote)',
  dni_batch:     'DNI (lote)',
  cpe:           'CPE',
  'tipo-cambio': 'Tipo de cambio',
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('plan_id')
    .eq('id', user.id)
    .single()

  if (userData?.plan_id !== 3) {
    return NextResponse.json(
      { error: 'Esta función es exclusiva del plan Pro' },
      { status: 403 }
    )
  }

  const { data: rows, error } = await supabase
    .from('consultas_log')
    .select('created_at, tipo, parametro, exitoso')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[historial/export]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }

  const header = 'Fecha,Tipo,Parámetro,Estado'

  const lines = (rows ?? []).map((r) => {
    const fecha  = new Date(r.created_at).toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    })
    const tipo   = escapeCsv(TIPO_LABELS[r.tipo] ?? r.tipo)
    const param  = escapeCsv(r.parametro ?? '')
    const estado = r.exitoso ? 'Exitoso' : 'Fallido'
    return `${fecha},${tipo},${param},${estado}`
  })

  // BOM para compatibilidad con Excel en Windows
  const csv = '﻿' + [header, ...lines].join('\r\n')

  const filename = `historial_consultas_${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

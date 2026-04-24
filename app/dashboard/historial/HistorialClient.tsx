'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ConsultaRow = {
  id: string
  created_at: string
  tipo: string
  parametro: string
  exitoso: boolean
}

const TIPO_LABELS: Record<string, string> = {
  ruc:           'RUC',
  dni:           'DNI',
  ruc_batch:     'RUC (lote)',
  dni_batch:     'DNI (lote)',
  cpe:           'CPE',
  'tipo-cambio': 'Tipo de cambio',
}

const PAGE_SIZE = 50

interface HistorialClientProps {
  initialRows: ConsultaRow[]
  initialTotal: number
  userId: string
}

export default function HistorialClient({ initialRows, initialTotal, userId }: HistorialClientProps) {
  const [rows, setRows] = useState<ConsultaRow[]>(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const supabase = createClient()

  const fetchPage = async (pageIndex: number) => {
    setLoading(true)
    const from = pageIndex * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const { data, count } = await supabase
      .from('consultas_log')
      .select('id, created_at, tipo, parametro, exitoso', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    setRows(data ?? [])
    setTotal(count ?? 0)
    setPage(pageIndex)
    setLoading(false)
  }

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const res = await fetch('/api/historial/export')
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Error al exportar')
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match       = disposition.match(/filename="([^"]+)"/)
      a.download        = match ? match[1] : 'historial_consultas.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-4xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de consultas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} consulta{total !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          {exportError && <p className="text-xs text-red-600">{exportError}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[150px_1fr_1fr_80px] gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Parámetro</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</span>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-gray-400">Cargando...</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">No hay consultas registradas aún.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <div key={r.id} className="grid grid-cols-[150px_1fr_1fr_80px] gap-4 px-4 py-3 items-center">
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(r.created_at).toLocaleString('es-PE', {
                        timeZone: 'America/Lima',
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: false,
                      })}
                    </span>
                    <span className="text-sm text-gray-700">
                      {TIPO_LABELS[r.tipo] ?? r.tipo}
                    </span>
                    <span className="text-sm text-gray-800 font-mono truncate">
                      {r.parametro}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                      r.exitoso
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {r.exitoso ? 'Exitoso' : 'Fallido'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

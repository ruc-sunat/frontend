import { createClient } from '@/lib/supabase/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basico: 'Básico',
  pro: 'Pro',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Uso mensual desde la vista
  const { data: uso } = await supabase
    .from('v_uso_mensual')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  // Estado del padrón SUNAT (con fallback si el API no responde)
  let status: { datos?: { disponible: boolean; ultima_actualizacion?: string }; ultimo_etl?: { estado: string; fecha_fin?: string } } | null = null
  try {
    const res = await fetch(`${API_URL}/api/v1/status`, { next: { revalidate: 3600 } })
    if (res.ok) status = await res.json()
  } catch {
    // API no disponible
  }

  const consultas = uso?.consultas_este_mes ?? 0
  const limite = uso?.limite ?? 100
  const plan = uso?.plan ?? 'free'
  const porcentaje = limite > 0 ? Math.min((consultas / limite) * 100, 100) : 0

  const ahora = new Date()
  const resetDate = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
  const resetStr = resetDate.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resumen</h1>

      {/* Card uso mensual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Uso este mes</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">
              {consultas.toLocaleString()}
              <span className="text-lg font-normal text-gray-400">
                {' '}/ {limite.toLocaleString()}
              </span>
            </p>
          </div>
          <span className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
            {PLAN_LABELS[plan] ?? plan}
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              porcentaje >= 90 ? 'bg-red-500' : porcentaje >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Reset el {resetStr} · {Math.round(porcentaje)}% usado
        </p>
      </div>

      {/* Card estado padrón */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm font-medium text-gray-500 mb-3">Estado del padrón SUNAT</p>
        {status ? (
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status.datos?.disponible ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-700">
              {status.datos?.disponible ? 'Disponible' : 'No disponible'}
            </span>
            {status.datos?.ultima_actualizacion && (
              <span className="text-xs text-gray-400 ml-2">
                Actualizado:{' '}
                {new Date(status.datos.ultima_actualizacion).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No se pudo obtener el estado del API</p>
        )}
      </div>
    </div>
  )
}

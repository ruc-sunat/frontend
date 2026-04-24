import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HistorialClient from './HistorialClient'

const PAGE_SIZE = 50

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('plan_id')
    .eq('id', user!.id)
    .single()

  const planId = userData?.plan_id ?? 1

  if (planId !== 3) {
    return (
      <div className="max-w-4xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Historial de consultas</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
          <span className="text-4xl mb-4">☰</span>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Función exclusiva del plan Pro</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Accede al historial completo de tus consultas y expórtalas en formato CSV con el plan Pro.
          </p>
          <Link
            href="/dashboard/planes"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </div>
    )
  }

  const [{ data: rows }, { count }] = await Promise.all([
    supabase
      .from('consultas_log')
      .select('id, created_at, tipo, parametro, exitoso')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from('consultas_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  return (
    <HistorialClient
      initialRows={rows ?? []}
      initialTotal={count ?? 0}
      userId={user!.id}
    />
  )
}

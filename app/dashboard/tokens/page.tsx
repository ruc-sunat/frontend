'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Token = {
  id: string
  token: string
  nombre: string | null
  activo: boolean
  created_at: string
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchTokens = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setTokens(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  const createToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('tokens').insert({
      user_id: user.id,
      nombre: nombre.trim() || null,
    })

    if (error) {
      setError(error.message)
    } else {
      setNombre('')
      await fetchTokens()
    }
    setCreating(false)
  }

  const deactivateToken = async (id: string) => {
    await supabase.from('tokens').update({ activo: false }).eq('id', id)
    setTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, activo: false } : t))
    )
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tokens de API</h1>

      {/* Crear token */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Nuevo token</h2>
        <form onSubmit={createToken} className="flex gap-3">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre descriptivo (opcional)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {creating ? 'Creando...' : 'Crear token'}
          </button>
        </form>
        {error && (
          <p className="text-xs text-red-600 mt-2">{error}</p>
        )}
      </div>

      {/* Lista de tokens */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="p-6 text-sm text-gray-400">Cargando...</div>
        ) : tokens.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">No tienes tokens aún. Crea uno arriba.</div>
        ) : (
          tokens.map((t) => (
            <div key={t.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-800">
                    {t.nombre ?? 'Sin nombre'}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      t.activo
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono truncate">{t.token}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Creado {new Date(t.created_at).toLocaleDateString('es-PE')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => copyToken(t.token)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied === t.token ? '✓ Copiado' : 'Copiar'}
                </button>
                {t.activo && (
                  <button
                    onClick={() => deactivateToken(t.id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

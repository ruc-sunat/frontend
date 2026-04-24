'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Token = {
  id: string
  token: string
  nombre: string | null
  activo: boolean
  created_at: string
}

const TOKEN_LIMITS = {
  1: 1,
  2: 3,
  3: -1,
}

interface TokensClientProps {
  initialTokens: Token[]
  planId: number
  userId: string
}

export default function TokensClient({ initialTokens, planId, userId }: TokensClientProps) {
  const [tokens, setTokens] = useState<Token[]>(initialTokens)
  const [nombre, setNombre] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  const tokenLimit = TOKEN_LIMITS[planId as keyof typeof TOKEN_LIMITS] ?? 1
  const isUnlimited = tokenLimit === -1
  const canCreateToken = isUnlimited || tokens.length < tokenLimit

  const refreshTokens = async () => {
    const { data } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setTokens(data ?? [])
  }

  const createToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!canCreateToken) {
      setError(`Has alcanzado el límite de ${tokenLimit} token${tokenLimit === 1 ? '' : 's'} para tu plan`)
      return
    }

    setCreating(true)

    const { error } = await supabase.from('tokens').insert({
      user_id: userId,
      nombre: nombre.trim() || null,
    })

    if (error) {
      if (error.message.includes('Límite de tokens')) {
        setError(`Has alcanzado el límite de ${tokenLimit} token${tokenLimit === 1 ? '' : 's'} para tu plan`)
      } else {
        setError('No se pudo crear el token. Intenta de nuevo.')
      }
    } else {
      setNombre('')
      await refreshTokens()
    }
    setCreating(false)
  }

  const deactivateToken = async (id: string) => {
    await supabase.from('tokens').update({ activo: false }).eq('id', id)
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, activo: false } : t)))
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-3xl w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tokens de API</h1>

      {/* Crear token */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Nuevo token</h2>
          {!isUnlimited && (
            <span className="text-xs text-gray-500">
              {tokens.length} / {tokenLimit} tokens
            </span>
          )}
        </div>
        <form onSubmit={createToken} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre descriptivo (opcional)"
            disabled={!canCreateToken}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={creating || !canCreateToken}
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
        {tokens.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">No tienes tokens aún. Crea uno arriba.</div>
        ) : (
          tokens.map((t) => (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
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
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button
                  onClick={() => copyToken(t.token)}
                  className="text-xs px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer font-medium"
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

'use client'

interface CuentaClientProps {
  userEmail: string
}

export default function CuentaClient({ userEmail }: CuentaClientProps) {

  return (
    <div className="space-y-6">
      {/* Información de cuenta */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de cuenta</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Email
            </label>
            <p className="text-sm text-gray-900">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

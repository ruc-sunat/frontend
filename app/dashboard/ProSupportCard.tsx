'use client'

import { useState } from 'react'
import ContactFormModal from './ContactFormModal'

export default function ProSupportCard() {
  const [showContactModal, setShowContactModal] = useState(false)

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                PRO
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Soporte directo disponible
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Como usuario Pro, tienes acceso a soporte prioritario. Envía tu consulta y nos comunicaremos pronto.
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>💬</span>
              Contactar a soporte
            </button>
          </div>
          <div className="text-5xl ml-4">🚀</div>
        </div>
      </div>

      <ContactFormModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </>
  )
}

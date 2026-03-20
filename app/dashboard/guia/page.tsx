'use client'

import { useState } from 'react'

type Lang = 'curl' | 'python' | 'javascript' | 'php'

const tabs: { id: Lang; label: string; filename: string }[] = [
  { id: 'curl',       label: 'cURL',       filename: 'consulta.sh'  },
  { id: 'python',     label: 'Python',     filename: 'consulta.py'  },
  { id: 'javascript', label: 'JavaScript', filename: 'consulta.js'  },
  { id: 'php',        label: 'PHP',        filename: 'consulta.php' },
]

const fields = [
  { name: 'ruc',         desc: 'Número de RUC del contribuyente (11 dígitos)' },
  { name: 'razonSocial', desc: 'Nombre o razón social registrada en SUNAT' },
  { name: 'estado',      desc: 'Estado del contribuyente: ACTIVO, BAJA, etc.' },
  { name: 'condicion',   desc: 'Condición de domicilio: HABIDO, NO HABIDO, etc.' },
  { name: 'direccion',   desc: 'Domicilio fiscal registrado' },
  { name: 'ubigeo',      desc: 'Ubicación geográfica: Departamento, Provincia, Distrito' },
]

const codeSnippets: Record<Lang, string> = {
  curl: `# Consulta un RUC
curl -X GET \\
  "https://api.consultaperuapi.com/api/ruc/20601138572" \\
  -H "Authorization: Bearer TU_API_KEY"

# Respuesta
{
  "ruc": "20601138572",
  "razonSocial": "EMPRESA EJEMPLO S.A.C.",
  "estado": "ACTIVO",
  "condicion": "HABIDO",
  "direccion": "AV. EJEMPLO 123, LIMA",
  "ubigeo": "LIMA, LIMA, LIMA"
}`,

  python: `import requests

API_KEY = "TU_API_KEY"
RUC     = "20601138572"

headers = {
    "Authorization": f"Bearer {API_KEY}"
}

response = requests.get(
    f"https://api.consultaperuapi.com/api/ruc/{RUC}",
    headers=headers
)

data = response.json()
print(data["razonSocial"])  # "EMPRESA EJEMPLO S.A.C."
print(data["estado"])       # "ACTIVO"`,

  javascript: `const API_KEY = "TU_API_KEY";
const ruc    = "20601138572";

const response = await fetch(
  \`https://api.consultaperuapi.com/api/ruc/\${ruc}\`,
  {
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`
    }
  }
);

const data = await response.json();
console.log(data.razonSocial);  // "EMPRESA EJEMPLO S.A.C."
console.log(data.estado);       // "ACTIVO"`,

  php: `<?php

$apiKey = "TU_API_KEY";
$ruc    = "20601138572";
$url    = "https://api.consultaperuapi.com/api/ruc/{$ruc}";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        "Authorization: Bearer {$apiKey}"
    ]
]);

$body = curl_exec($ch);
$data = json_decode($body);

echo $data->razonSocial;  // "EMPRESA EJEMPLO S.A.C."
echo $data->estado;       // "ACTIVO"`,
}

export default function GuiaPage() {
  const [active, setActive] = useState<Lang>('curl')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[active])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentTab = tabs.find(t => t.id === active)!

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Guía de integración</h1>
      <p className="text-sm text-gray-500 mb-6">Ejemplos de código para consultar la API desde tu lenguaje favorito.</p>

      {/* Endpoint */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Endpoint</p>
        <div className="flex items-center gap-3">
          <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded">GET</span>
          <code className="text-sm font-mono text-gray-800">
            /api/ruc/<span className="text-blue-600">{'{ruc}'}</span>
          </code>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Header requerido: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer TU_API_KEY</code>
        </p>
      </div>

      {/* Tabs de lenguaje */}
      <div className="flex gap-2 mb-0 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              active === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="bg-gray-900 rounded-b-xl rounded-tr-xl overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-gray-400 font-mono">{currentTab.filename}</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <pre className="p-5 text-sm leading-relaxed overflow-x-auto font-mono text-gray-300">
          {codeSnippets[active]}
        </pre>
      </div>

      {/* Campos de respuesta */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Campos de la respuesta</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.name} className="flex items-start gap-3">
              <code className="text-xs bg-gray-50 border border-gray-200 text-blue-600 px-2 py-1 rounded font-mono shrink-0">
                {f.name}
              </code>
              <p className="text-xs text-gray-500 pt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

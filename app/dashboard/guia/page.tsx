'use client'

import { useState } from 'react'

type Lang = 'curl' | 'python' | 'javascript' | 'php'
type EndpointType = 'ruc' | 'dni'

const languageTabs: { id: Lang; label: string; filename: string }[] = [
  { id: 'curl',       label: 'cURL',       filename: 'consulta.sh'  },
  { id: 'python',     label: 'Python',     filename: 'consulta.py'  },
  { id: 'javascript', label: 'JavaScript', filename: 'consulta.js'  },
  { id: 'php',        label: 'PHP',        filename: 'consulta.php' },
]

const rucFields = [
  { name: 'ruc',          desc: 'Número de RUC del contribuyente (11 dígitos)' },
  { name: 'razon_social', desc: 'Nombre o razón social registrada en SUNAT' },
  { name: 'estado',       desc: 'Estado del contribuyente: ACTIVO, BAJA, etc.' },
  { name: 'condicion',    desc: 'Condición de domicilio: HABIDO, NO HABIDO, etc.' },
  { name: 'ubigeo',       desc: 'Código de ubicación geográfica (6 dígitos)' },
  { name: 'direccion',    desc: 'Objeto con domicilio fiscal: tipo_via, nom_via, nro, distrito, provincia, departamento' },
]

const dniFields = [
  { name: 'dni',           desc: 'Número de DNI del contribuyente (8 dígitos)' },
  { name: 'nombres',       desc: 'Nombres de la persona' },
  { name: 'apellidoPaterno', desc: 'Apellido paterno' },
  { name: 'apellidoMaterno', desc: 'Apellido materno' },
  { name: 'nombreCompleto', desc: 'Nombre completo formateado' },
  { name: 'direccion',     desc: 'Dirección del domicilio fiscal' },
  { name: 'fuente',        desc: 'Fuente de los datos: padron_local o callback' },
]

const codeSnippets: Record<EndpointType, Record<Lang, string>> = {
  ruc: {
    curl: `# Consulta un RUC
curl -X POST \\
  "https://api.consultaperuapi.com/api/v1/consultas" \\
  -H "Content-Type: application/json" \\
  -d '{"token": "TU_API_KEY", "ruc": "20123456789"}'

# Respuesta
{
  "ruc": "20123456789",
  "razon_social": "TECH SOLUTIONS PERÚ S.A.C.",
  "estado": "ACTIVO",
  "condicion": "HABIDO",
  "ubigeo": "150101",
  "direccion": {
    "departamento": "LIMA",
    "provincia": "LIMA",
    "distrito": "LIMA"
  }
}`,

    python: `import requests

API_KEY = "TU_API_KEY"
RUC     = "20123456789"

response = requests.post(
    "https://api.consultaperuapi.com/api/v1/consultas",
    json={"token": API_KEY, "ruc": RUC}
)

data = response.json()
print(data["razon_social"])  # "TECH SOLUTIONS PERÚ S.A.C."
print(data["estado"])        # "ACTIVO"`,

    javascript: `const API_KEY = "TU_API_KEY";
const ruc     = "20123456789";

const response = await fetch(
  "https://api.consultaperuapi.com/api/v1/consultas",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: API_KEY, ruc })
  }
);

const data = await response.json();
console.log(data.razon_social);  // "TECH SOLUTIONS PERÚ S.A.C."
console.log(data.estado);        // "ACTIVO"`,

    php: `<?php

$apiKey = "TU_API_KEY";
$ruc    = "20123456789";

$ch = curl_init("https://api.consultaperuapi.com/api/v1/consultas");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
    CURLOPT_POSTFIELDS     => json_encode(["token" => $apiKey, "ruc" => $ruc])
]);

$body = curl_exec($ch);
$data = json_decode($body);

echo $data->razon_social;  // "TECH SOLUTIONS PERÚ S.A.C."
echo $data->estado;        // "ACTIVO"`,
  },

  dni: {
    curl: `# Consulta un DNI (requiere plan Pro)
curl -X POST \\
  "https://api.consultaperuapi.com/api/v1/consultas-dni" \\
  -H "Content-Type: application/json" \\
  -d '{"token": "TU_API_KEY", "dni": "45678901"}'

# Respuesta
{
  "success": true,
  "data": {
    "dni": "45678901",
    "nombres": "CARLOS ANDRÉS",
    "apellidoPaterno": "MARTINEZ",
    "apellidoMaterno": "HERRERA",
    "nombreCompleto": "CARLOS ANDRÉS MARTINEZ HERRERA",
    "direccion": "JR. AMAZONAS 456, DPTO 302",
    "fuente": "padron_local"
  }
}`,

    python: `import requests

API_KEY = "TU_API_KEY"
DNI     = "45678901"

response = requests.post(
    "https://api.consultaperuapi.com/api/v1/consultas-dni",
    json={"token": API_KEY, "dni": DNI}
)

data = response.json()
if data["success"]:
    print(data["data"]["nombreCompleto"])  # "CARLOS ANDRÉS MARTINEZ HERRERA"
    print(data["data"]["direccion"])       # "JR. AMAZONAS 456, DPTO 302"`,

    javascript: `const API_KEY = "TU_API_KEY";
const dni     = "45678901";

const response = await fetch(
  "https://api.consultaperuapi.com/api/v1/consultas-dni",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: API_KEY, dni })
  }
);

const data = await response.json();
if (data.success) {
  console.log(data.data.nombreCompleto);  // "CARLOS ANDRÉS MARTINEZ HERRERA"
  console.log(data.data.direccion);       // "JR. AMAZONAS 456, DPTO 302"
}`,

    php: `<?php

$apiKey = "TU_API_KEY";
$dni    = "45678901";

$ch = curl_init("https://api.consultaperuapi.com/api/v1/consultas-dni");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
    CURLOPT_POSTFIELDS     => json_encode(["token" => $apiKey, "dni" => $dni])
]);

$body = curl_exec($ch);
$data = json_decode($body);

if ($data->success) {
    echo $data->data->nombreCompleto;  // "CARLOS ANDRÉS MARTINEZ HERRERA"
    echo $data->data->direccion;       // "JR. AMAZONAS 456, DPTO 302"
}`,
  }
}

export default function GuiaPage() {
  const [endpoint, setEndpoint] = useState<EndpointType>('ruc')
  const [language, setLanguage] = useState<Lang>('curl')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[endpoint][language])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentTab = languageTabs.find(t => t.id === language)!
  const currentFields = endpoint === 'ruc' ? rucFields : dniFields
  const endpointPath = endpoint === 'ruc' ? '/api/v1/consultas' : '/api/v1/consultas-dni'
  const bodyExample = endpoint === 'ruc'
    ? '{ "token": "TU_API_KEY", "ruc": "20123456789" }'
    : '{ "token": "TU_API_KEY", "dni": "45678901" }'

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Guía de integración</h1>
      <p className="text-sm text-gray-500 mb-6">Ejemplos de código para consultar la API desde tu lenguaje favorito.</p>

      {/* Selección de Endpoint */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setEndpoint('ruc')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            endpoint === 'ruc'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💼 Buscar RUC
        </button>
        <button
          onClick={() => setEndpoint('dni')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            endpoint === 'dni'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          👤 Buscar DNI
        </button>
      </div>

      {/* Endpoint info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Endpoint</p>
        <div className="flex items-center gap-3">
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">POST</span>
          <code className="text-sm font-mono text-gray-800">{endpointPath}</code>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Body requerido: <code className="bg-gray-100 px-1 rounded">{bodyExample}</code>
        </p>
      </div>

      {/* Tabs de lenguaje */}
      <div className="flex gap-2 mb-0 flex-wrap">
        {languageTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setLanguage(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              language === tab.id
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
          {codeSnippets[endpoint][language]}
        </pre>
      </div>

      {/* Campos de respuesta */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Campos de la respuesta</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {currentFields.map(f => (
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

'use client'

import { useState } from 'react'

type Lang = 'curl' | 'python' | 'javascript' | 'php'
type EndpointType = 'ruc' | 'dni' | 'tipocambio' | 'cpe'

const languageTabs: { id: Lang; label: string }[] = [
  { id: 'curl',       label: 'cURL'       },
  { id: 'python',     label: 'Python'     },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'php',        label: 'PHP'        },
]

const filenameMap: Record<EndpointType, Record<Lang, string>> = {
  ruc:        { curl: 'consulta.sh',     python: 'consulta.py',     javascript: 'consulta.js',     php: 'consulta.php'     },
  dni:        { curl: 'consulta.sh',     python: 'consulta.py',     javascript: 'consulta.js',     php: 'consulta.php'     },
  tipocambio: { curl: 'tipo_cambio.sh',  python: 'tipo_cambio.py',  javascript: 'tipo_cambio.js',  php: 'tipo_cambio.php'  },
  cpe:        { curl: 'validar_cpe.sh',  python: 'validar_cpe.py',  javascript: 'validar_cpe.js',  php: 'validar_cpe.php'  },
}

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

const tipocambioFields = [
  { name: 'fecha',   desc: 'Fecha de la cotización en formato YYYY-MM-DD' },
  { name: 'moneda',  desc: 'Código de moneda: USD, EUR, etc.' },
  { name: 'compra',  desc: 'Tipo de cambio de compra (soles por unidad)' },
  { name: 'venta',   desc: 'Tipo de cambio de venta (soles por unidad)' },
  { name: 'fuente',  desc: 'Fuente oficial de los datos: SBS' },
]

const cpeFields = [
  { name: 'valido',               desc: 'true si el comprobante existe y es válido en SUNAT' },
  { name: 'tipo_comprobante',     desc: 'Código del tipo: 01=Factura, 03=Boleta, 07=Nota crédito, 08=Nota débito' },
  { name: 'descripcion_tipo',     desc: 'Descripción legible del tipo de comprobante' },
  { name: 'fecha_emision',        desc: 'Fecha de emisión del comprobante (YYYY-MM-DD)' },
  { name: 'monto_total',          desc: 'Monto total del comprobante en soles' },
  { name: 'estado',               desc: 'Estado en SUNAT: ACEPTADO, ANULADO, NO EXISTE, AUTORIZADO' },
  { name: 'estado_contribuyente', desc: 'Estado del emisor: ACTIVO, BAJA, etc.' },
  { name: 'condicion_domicilio',  desc: 'Condición del domicilio del emisor: HABIDO, NO HABIDO, etc.' },
  { name: 'observaciones',        desc: 'Observaciones adicionales de SUNAT (puede ser null)' },
  { name: 'fuente',               desc: 'Fuente de la consulta: SUNAT' },
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
  },

  tipocambio: {
    curl: `# Consulta el tipo de cambio de hoy
curl -X GET \\
  "https://api.consultaperuapi.com/api/v1/tipo-cambio?token=tu_api_key"

# O enviando token y fecha en el body
curl -X GET \\
  "https://api.consultaperuapi.com/api/v1/tipo-cambio" \\
  -H "Content-Type: application/json" \\
  -d '{"token": "tu_api_key", "fecha": "2026-04-17"}'

# Respuesta
{
  "fecha": "2025-01-15",
  "moneda": "USD",
  "compra": 3.710,
  "venta": 3.715,
  "fuente": "SBS"
}`,

    python: `import requests

API_KEY = "TU_API_KEY"

# Sin fecha → retorna el tipo de cambio de hoy
response = requests.get(
    "https://api.consultaperuapi.com/api/v1/tipo-cambio",
    params={"token": API_KEY}
)

# Con fecha específica (opcional)
response = requests.get(
    "https://api.consultaperuapi.com/api/v1/tipo-cambio",
    params={"token": API_KEY, "fecha": "2025-01-15"}
)

data = response.json()
print(data["compra"])   # 3.710
print(data["venta"])    # 3.715
print(data["fuente"])   # "SBS"`,

    javascript: `const API_KEY = "TU_API_KEY";

// Sin fecha → retorna el tipo de cambio de hoy
const res = await fetch(
  \`https://api.consultaperuapi.com/api/v1/tipo-cambio?token=\${API_KEY}\`
);

// Con fecha específica (opcional)
const resConFecha = await fetch(
  \`https://api.consultaperuapi.com/api/v1/tipo-cambio?token=\${API_KEY}&fecha=2025-01-15\`
);

const data = await res.json();
console.log(data.compra);   // 3.710
console.log(data.venta);    // 3.715
console.log(data.fuente);   // "SBS"`,

    php: `<?php

$apiKey = "TU_API_KEY";
$fecha  = "2025-01-15"; // Opcional

$url = "https://api.consultaperuapi.com/api/v1/tipo-cambio"
     . "?token=" . urlencode($apiKey)
     . "&fecha=" . urlencode($fecha);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPGET        => true,
]);

$body = curl_exec($ch);
$data = json_decode($body);

echo $data->compra;   // 3.710
echo $data->venta;    // 3.715
echo $data->fuente;   // "SBS"`,
  },

  cpe: {
    curl: `# Valida un comprobante electrónico (requiere plan Starter o Pro)
curl -X POST \\
  "https://api.consultaperuapi.com/api/v1/cpe/consultar" \\
  -H "Content-Type: application/json" \\
  -d '{"token":"TU_API_KEY","ruc":"20601138572","tipo":"01","serie":"F001","correlativo":"1234","fecha":"2026-01-15","monto":1180.00}'

# Respuesta
{
  "valido": true,
  "ruc_emisor": "20601138572",
  "tipo_comprobante": "01",
  "descripcion_tipo": "Factura",
  "serie": "F001",
  "correlativo": "1234",
  "fecha_emision": "2026-01-15",
  "monto_total": 1180.00,
  "estado": "ACEPTADO",
  "estado_contribuyente": "ACTIVO",
  "condicion_domicilio": "HABIDO",
  "observaciones": null,
  "fuente": "SUNAT"
}`,

    python: `import requests

API_KEY     = "TU_API_KEY"
RUC         = "20601138572"
TIPO        = "01"   # 01=Factura, 03=Boleta, 07=Nota crédito, 08=Nota débito
SERIE       = "F001"
CORRELATIVO = "1234"
FECHA       = "2026-01-15"
MONTO       = 1180.00

response = requests.post(
    "https://api.consultaperuapi.com/api/v1/cpe/consultar",
    json={
        "token": API_KEY, "ruc": RUC, "tipo": TIPO,
        "serie": SERIE, "correlativo": CORRELATIVO,
        "fecha": FECHA, "monto": MONTO
    }
)

data = response.json()
print(data["valido"])   # True
print(data["estado"])   # "ACEPTADO"
print(data["fuente"])   # "SUNAT"`,

    javascript: `const API_KEY = "TU_API_KEY";

const response = await fetch(
  "https://api.consultaperuapi.com/api/v1/cpe/consultar",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token:       API_KEY,
      ruc:         "20601138572",
      tipo:        "01",  // 01=Factura, 03=Boleta, 07=Nota crédito, 08=Nota débito
      serie:       "F001",
      correlativo: "1234",
      fecha:       "2026-01-15",
      monto:       1180.00
    })
  }
);

const data = await response.json();
console.log(data.valido);   // true
console.log(data.estado);   // "ACEPTADO"
console.log(data.fuente);   // "SUNAT"`,

    php: `<?php

$apiKey = "TU_API_KEY";

$ch = curl_init("https://api.consultaperuapi.com/api/v1/cpe/consultar");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
    CURLOPT_POSTFIELDS     => json_encode([
        "token"       => $apiKey,
        "ruc"         => "20601138572",
        "tipo"        => "01",  // 01=Factura, 03=Boleta, 07=Nota crédito, 08=Nota débito
        "serie"       => "F001",
        "correlativo" => "1234",
        "fecha"       => "2026-01-15",
        "monto"       => 1180.00
    ])
]);

$body = curl_exec($ch);
$data = json_decode($body);

echo $data->valido;   // true
echo $data->estado;   // "ACEPTADO"
echo $data->fuente;   // "SUNAT"`,
  },
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

  const currentFields =
    endpoint === 'ruc'        ? rucFields :
    endpoint === 'dni'        ? dniFields :
    endpoint === 'tipocambio' ? tipocambioFields :
    cpeFields

  const endpointPath =
    endpoint === 'ruc'        ? '/api/v1/consultas' :
    endpoint === 'dni'        ? '/api/v1/consultas-dni' :
    endpoint === 'tipocambio' ? '/api/v1/tipo-cambio' :
                                '/api/v1/cpe/consultar'

  const isGet      = endpoint === 'tipocambio'
  const httpMethod = isGet ? 'GET' : 'POST'

  return (
    <div className="max-w-3xl w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Guía de integración</h1>
      <p className="text-sm text-gray-500 mb-6">Ejemplos de código para consultar la API desde tu lenguaje favorito.</p>

      {/* Selección de Endpoint */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['ruc', 'dni', 'tipocambio', 'cpe'] as EndpointType[]).map((ep) => {
          const labels: Record<EndpointType, string> = {
            ruc:        '💼 Buscar RUC',
            dni:        '👤 Buscar DNI',
            tipocambio: '💱 Tipo de cambio',
            cpe:        '🧾 Validar CPE',
          }
          return (
            <button
              key={ep}
              onClick={() => setEndpoint(ep)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                endpoint === ep
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {labels[ep]}
            </button>
          )
        })}
      </div>

      {/* Endpoint info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Endpoint</p>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-1 rounded ${isGet ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
            {httpMethod}
          </span>
          <code className="text-sm font-mono text-gray-800">{endpointPath}</code>
        </div>
        {isGet ? (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-400">
              Query params: <code className="bg-gray-100 px-1 rounded">?token=TU_API_KEY&amp;fecha=2025-01-15</code>{' '}
              <span className="text-gray-400">(fecha es opcional, formato YYYY-MM-DD)</span>
            </p>
            <p className="text-xs text-gray-400">
              O como body JSON: <code className="bg-gray-100 px-1 rounded">{`{"token": "TU_API_KEY", "fecha": "2026-04-17"}`}</code>
            </p>
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-400">
              Body requerido:{' '}
              <code className="bg-gray-100 px-1 rounded">
                {endpoint === 'cpe'
                  ? '{"token":"TU_API_KEY","ruc":"20601138572","tipo":"01","serie":"F001","correlativo":"1234","fecha":"2026-01-15","monto":1180.00}'
                  : endpoint === 'ruc'
                    ? '{"token": "TU_API_KEY", "ruc": "20123456789"}'
                    : '{"token": "TU_API_KEY", "dni": "45678901"}'}
              </code>
            </p>
            {endpoint === 'cpe' && (
              <p className="text-xs text-gray-400">
                tipo: <code className="bg-gray-100 px-1 rounded">01</code>=Factura · <code className="bg-gray-100 px-1 rounded">03</code>=Boleta · <code className="bg-gray-100 px-1 rounded">07</code>=Nota de crédito · <code className="bg-gray-100 px-1 rounded">08</code>=Nota de débito
              </p>
            )}
          </div>
        )}
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
      <div className="bg-gray-900 rounded-b-xl rounded-tr-xl overflow-x-auto mb-5">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-gray-400 font-mono">{filenameMap[endpoint][language]}</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <pre className="p-3 sm:p-5 text-xs sm:text-sm leading-relaxed overflow-x-auto font-mono text-gray-300">
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

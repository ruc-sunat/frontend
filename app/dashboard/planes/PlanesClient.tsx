"use client";

import { useEffect, useRef, useState } from "react";

const PLANES = [
  {
    id: 1,
    nombre: "Free",
    precio: 0,
    moneda: "",
    consultas: "500 consultas/mes",
    features: [
      "500 consultas mensuales",
      "2 req/seg (rate limit)",
      "POST /ruc/{ruc} y POST /dni/{dni}",
    ],
  },
  {
    id: 2,
    nombre: "Starter",
    precio: 19,
    moneda: "PEN",
    consultas: "Consultas ilimitadas",
    features: [
      "Consultas ilimitadas",
      "10 req/seg (rate limit)",
      "POST /ruc/{ruc} y POST /dni/{dni}",
      "GET Tipo de cambio SBS",
      "Datos completos del RUC y DNI",
      "Documentación y ejemplos",
    ],
  },
  {
    id: 3,
    nombre: "Pro",
    precio: 35,
    moneda: "PEN",
    consultas: "Consultas ilimitadas",
    features: [
      "Consultas ilimitadas",
      "30 req/seg (rate limit)",
      "POST /ruc/{ruc} y POST /dni/{dni}",
      "GET Tipo de cambio SBS",
      "Datos completos del RUC y DNI",
      "Documentación y ejemplos",
      "Soporte virtual para implementación",
    ],
  },
];

const PRECIOS_ANUALES: Record<number, number> = {
  2: 170,
  3: 300,
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    KR: any;
  }
}

function getPrecio(planId: number, cycle: "monthly" | "annual"): number {
  if (cycle === "annual") return PRECIOS_ANUALES[planId] ?? 0;
  return PLANES.find((p) => p.id === planId)?.precio ?? 0;
}

function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type InitialData = {
  plan_id: number;
  billing_cycle: "monthly" | "annual";
  subscription_status: string;
  plan_expires_at: string | null;
};

export default function PlanesClient({
  initialData,
}: {
  initialData: InitialData;
}) {
  const [planActual, setPlanActual] = useState<number>(initialData.plan_id);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    initialData.billing_cycle,
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>(
    initialData.subscription_status,
  );
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(
    initialData.plan_expires_at,
  );
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "annual">(
    initialData.billing_cycle,
  );
  const [procesando, setProcesando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [mensajeExito, setMensajeExito] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const krInitialized = useRef(false);

  // Estado efectivo: si el cron aún no corrió pero ya venció, tratar como expirado
  const effectiveStatus =
    subscriptionStatus !== "none" &&
    planExpiresAt &&
    new Date(planExpiresAt) < new Date()
      ? "expired"
      : subscriptionStatus;

  useEffect(() => {
    // Cargar CSS de Izipay
    if (!document.getElementById("izipay-css")) {
      const link = document.createElement("link");
      link.id = "izipay-css";
      link.rel = "stylesheet";
      link.href =
        "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.css";
      document.head.appendChild(link);
    }

    // Cargar JS de Izipay (Krypton)
    if (!document.getElementById("izipay-script")) {
      const script = document.createElement("script");
      script.id = "izipay-script";
      script.src =
        "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js";
      script.setAttribute(
        "kr-public-key",
        process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY!,
      );
      script.setAttribute("kr-language", "es-PE");
      document.head.appendChild(script);
    }

    // Estilos personalizados para el formulario Krypton
    if (!document.getElementById("izipay-custom-css")) {
      const style = document.createElement("style");
      style.id = "izipay-custom-css";
      style.textContent = `
        .kr-embedded {
          padding: 0 !important;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
        }
        .kr-embedded .kr-field-wrapper {
          border: 1px solid #d1d5db !important;
          border-radius: 8px !important;
          background: #fff !important;
          min-height: 44px !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 12px !important;
          margin-bottom: 12px !important;
          box-sizing: border-box !important;
        }
        .kr-embedded .kr-field-wrapper:focus-within {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
        }
        .kr-embedded .kr-label,
        .kr-embedded label {
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #374151 !important;
          margin-bottom: 4px !important;
          display: block !important;
        }
        .kr-embedded .kr-installment-number,
        .kr-embedded .kr-first-installment-delay,
        .kr-embedded [class*="installment"],
        .kr-embedded [class*="deferral"],
        .kr-embedded [class*="diferido"] {
          display: none !important;
        }
        .kr-payment-button {
          width: 100% !important;
          background-color: #2563eb !important;
          color: #fff !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 11px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          letter-spacing: 0.01em !important;
          cursor: pointer !important;
          margin-top: 4px !important;
          transition: background-color 0.15s !important;
        }
        .kr-payment-button:hover {
          background-color: #1d4ed8 !important;
        }
        .kr-form-error {
          color: #dc2626 !important;
          font-size: 13px !important;
          margin-top: 4px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleUpgrade = async (planId: number) => {
    setProcesando(planId);
    setMensaje("");
    setMensajeExito(false);

    const res = await fetch("/api/izipay/create-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, billing_cycle: selectedCycle }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMensaje(json.error ?? "Error al iniciar el pago.");
      setProcesando(null);
      return;
    }

    setSelectedPlan(planId);
    setShowModal(true);
    setProcesando(null);

    setTimeout(async () => {
      if (!window.KR) return;

      await window.KR.setFormConfig({ formToken: json.formToken });

      if (!krInitialized.current) {
        krInitialized.current = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.KR.onSubmit(async (paymentData: any) => {
          console.log("KR.onSubmit paymentData:", JSON.stringify(paymentData));
          setShowModal(false);
          setProcesando(selectedPlan ?? planId);

          const krAnswer =
            paymentData["kr-answer"] ?? paymentData.rawClientAnswer;
          const krHash = paymentData["kr-hash"] ?? paymentData.hash;

          const verifyRes = await fetch("/api/izipay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              krAnswer,
              krHash,
              plan_id: planId,
              billing_cycle: selectedCycle,
            }),
          });

          const verifyJson = await verifyRes.json();

          if (verifyRes.ok) {
            const newExpires =
              selectedCycle === "annual"
                ? new Date(
                    new Date().setFullYear(new Date().getFullYear() + 1),
                  ).toISOString()
                : new Date(
                    new Date().setMonth(new Date().getMonth() + 1),
                  ).toISOString();

            setPlanActual(planId);
            setSubscriptionStatus("active");
            setBillingCycle(selectedCycle);
            setPlanExpiresAt(newExpires);
            setMensajeExito(true);
            setMensaje("¡Suscripción activada exitosamente!");
          } else {
            setMensajeExito(false);
            setMensaje(verifyJson.error ?? "Error al verificar el pago.");
          }

          setProcesando(null);
          return false;
        });
      }
    }, 200);
  };

  const handleCancelSubscription = async () => {
    setCancelando(true);
    const res = await fetch("/api/cancel-subscription", { method: "POST" });
    const json = await res.json();

    if (res.ok) {
      setSubscriptionStatus("cancelled");
      setMensajeExito(true);
      setMensaje(
        `Suscripción cancelada. Mantendrás el acceso hasta el ${planExpiresAt ? formatDate(planExpiresAt) : "fin del período"}.`,
      );
    } else {
      setMensajeExito(false);
      setMensaje(json.error ?? "Error al cancelar la suscripción.");
    }

    setCancelando(false);
    setShowCancelModal(false);
  };

  const days = daysUntilExpiry(planExpiresAt);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Planes</h1>
      <p className="text-sm text-gray-500 mb-6">
        Elige el plan que se ajuste a tu volumen de consultas.
      </p>

      {/* Banner de renovación próxima */}
      {days !== null && days <= 7 && effectiveStatus !== "none" && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm border bg-amber-50 text-amber-800 border-amber-200 flex items-center justify-between">
          <span>
            Tu suscripción vence en{" "}
            <span className="font-semibold">
              {days <= 0
                ? "menos de 1 día"
                : `${days} día${days > 1 ? "s" : ""}`}
            </span>
            {effectiveStatus === "cancelled" &&
              ". Renueva para no perder el acceso."}
          </span>
          {effectiveStatus === "cancelled" && (
            <button
              onClick={() => {
                const card = document.getElementById("plan-cards");
                card?.scrollIntoView({ behavior: "smooth" });
              }}
              className="ml-4 text-amber-700 underline font-medium whitespace-nowrap"
            >
              Ver planes
            </button>
          )}
        </div>
      )}

      {/* Tarjeta de estado de suscripción */}
      {effectiveStatus !== "none" &&
        effectiveStatus !== "expired" &&
        planActual !== null &&
        planActual > 1 && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Tu suscripción
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
              <div>
                <span className="text-gray-400">Plan: </span>
                <span className="font-medium text-gray-800">
                  {PLANES.find((p) => p.id === planActual)?.nombre}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Ciclo: </span>
                <span className="font-medium text-gray-800">
                  {billingCycle === "annual" ? "Anual" : "Mensual"}
                </span>
              </div>
              {planExpiresAt && (
                <div>
                  <span className="text-gray-400">
                    {effectiveStatus === "cancelled"
                      ? "Acceso hasta: "
                      : "Próxima renovación: "}
                  </span>
                  <span className="font-medium text-gray-800">
                    {formatDate(planExpiresAt)}
                  </span>
                </div>
              )}
              <div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    effectiveStatus === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {effectiveStatus === "active" ? "Activa" : "Cancelada"}
                </span>
              </div>
            </div>
            {effectiveStatus === "active" && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-sm text-red-500 hover:text-red-700 underline"
              >
                Cancelar suscripción
              </button>
            )}
          </div>
        )}

      {mensaje && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm border ${
            mensajeExito
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {mensaje}
        </div>
      )}

      {/* Toggle de ciclo de facturación */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
          <button
            onClick={() => setSelectedCycle("monthly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedCycle === "monthly"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setSelectedCycle("annual")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedCycle === "annual"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Anual
            <span className="ml-1.5 text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              Hasta 29% de descuento
            </span>
          </button>
        </div>
      </div>

      <div id="plan-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANES.map((plan) => {
          const esPlanActualActivo =
            effectiveStatus === "active" && planActual === plan.id;
          const esPlanCancelado =
            effectiveStatus === "cancelled" && planActual === plan.id;
          const esMenor =
            planActual !== null &&
            plan.id < planActual &&
            effectiveStatus === "active";

          const botonDeshabilitado =
            plan.id === 1 ||
            esPlanActualActivo ||
            esMenor ||
            procesando === plan.id;

          let botonLabel: string;
          if (plan.id === 1) {
            botonLabel = "Plan gratuito";
          } else if (esPlanActualActivo) {
            botonLabel = "Plan actual";
          } else if (esPlanCancelado) {
            botonLabel =
              procesando === plan.id ? "Procesando..." : "Reactivar plan";
          } else if (esMenor) {
            botonLabel = "Plan inferior";
          } else if (procesando === plan.id) {
            botonLabel = "Procesando...";
          } else {
            botonLabel = `Suscribirse a ${plan.nombre}`;
          }

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-6 flex flex-col ${
                esPlanActualActivo
                  ? "border-blue-500 shadow-sm"
                  : "border-gray-200"
              }`}
            >
              {esPlanActualActivo && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full self-start mb-3">
                  Plan actual
                </span>
              )}
              {esPlanCancelado && (
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full self-start mb-3">
                  Cancelado
                </span>
              )}
              <h2 className="text-lg font-bold text-gray-900">{plan.nombre}</h2>
              <div className="mt-1 mb-1">
                {plan.precio === 0 ? (
                  <span className="text-3xl font-bold text-gray-900">
                    Gratis
                  </span>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      S/. {getPrecio(plan.id, selectedCycle)}
                      <span className="text-sm font-normal text-gray-400">
                        /{selectedCycle === "annual" ? "año" : "mes"}
                      </span>
                    </span>
                    {selectedCycle === "annual" && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Equivale a S/.{" "}
                        {Math.round(getPrecio(plan.id, "annual") / 12)}/mes
                      </p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">{plan.consultas}</p>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span className="text-green-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={botonDeshabilitado}
                onClick={() => !botonDeshabilitado && handleUpgrade(plan.id)}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  plan.id === 1 || esPlanActualActivo
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : esMenor
                      ? "bg-gray-50 text-gray-300 cursor-default"
                      : esPlanCancelado
                        ? "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                        : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                }`}
              >
                {botonLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de pago Izipay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Datos de pago
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pago seguro con Izipay ·{" "}
                  {selectedCycle === "annual"
                    ? "Suscripción anual"
                    : "Suscripción mensual"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setProcesando(null);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="kr-embedded">
                <div className="kr-pan"></div>
                <div className="kr-expiry"></div>
                <div className="kr-security-code"></div>
                <button className="kr-payment-button"></button>
                <div className="kr-form-error"></div>
              </div>
            </div>

            <div className="px-6 pb-4 flex items-center gap-1.5 text-xs text-gray-400">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Transacción segura — tus datos están protegidos
            </div>
          </div>
        </div>
      )}

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Cancelar suscripción
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Tu plan seguirá activo hasta el{" "}
              <span className="font-medium text-gray-700">
                {planExpiresAt ? formatDate(planExpiresAt) : "fin del período"}
              </span>
              . Después se bajará automáticamente al plan Free.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Mantener plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelando}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {cancelando ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

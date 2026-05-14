"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GaTracker({
  consultas,
  limite,
  plan,
}: {
  consultas: number;
  limite: number;
  plan: string;
}) {
  useEffect(() => {
    if (plan === "free" && limite > 0 && consultas >= limite) {
      window.gtag?.("event", "free_limit_reached", {
        consultas_usadas: consultas,
      });
    }
  }, []);
  return null;
}

"use client";

import { useState, useEffect } from "react";
import { Building2, UserPlus, User, CreditCard, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E5DE", color: "#1A1A1A" }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: "#D4AD3C" }}
      />
      {message}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#EBF3E8" }}
      >
        <Icon size={18} style={{ color: "#3D7A1C" }} />
      </div>
      <div>
        <h2 className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
      style={{ borderColor: "#F0EDE6" }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: "#9B9488" }}>
        {label}
      </span>
      <span className="text-sm text-right" style={{ color: value ? "#1A1A1A" : "#B0A99F" }}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function ConfigClient() {
  const { analysisResult, generatedReports } = useAppContext();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => setToast(msg);

  // Pull empresa data: from analysisResult and, if available, from calificacion_bancaria report
  const empresa = analysisResult?.empresa ?? null;
  const cuit    = analysisResult?.cuit ?? null;

  const calificacion = generatedReports.find((r) => r.reportId === "calificacion-bancaria")?.data;
  const dg = calificacion?.datos_generales ?? {};

  const actividad = dg.actividad ?? null;
  const domicilio  = dg.domicilio
    ? [dg.domicilio, dg.localidad, dg.provincia].filter(Boolean).join(", ")
    : null;
  const campana    = dg.campana_actual ?? null;

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          <header
            className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm"
            style={{ borderColor: "#E8E5DE" }}
          >
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Configuración</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Gestión de empresa y cuenta</p>
            </div>
          </header>

          <main className="px-8 py-7 max-w-2xl space-y-6">

            {/* ── Mi empresa ── */}
            <div
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: "#E8E5DE" }}
            >
              <div className="px-6 pt-6 pb-4">
                <SectionHeader
                  icon={Building2}
                  title="Mi empresa"
                  subtitle="Datos detectados automáticamente de tu documentación"
                />

                {!empresa ? (
                  <div
                    className="rounded-lg px-4 py-4 text-sm border"
                    style={{ backgroundColor: "#FFFBEB", borderColor: "#F5D87A", color: "#92680A" }}
                  >
                    No se detectó ninguna empresa. Subí documentos desde el Dashboard para que AgroForma identifique tu empresa automáticamente.
                  </div>
                ) : (
                  <div>
                    <DataRow label="Razón social"  value={empresa} />
                    <DataRow label="CUIT"          value={cuit} />
                    <DataRow label="Actividad"     value={actividad} />
                    <DataRow label="Domicilio"     value={domicilio} />
                    <DataRow label="Campaña actual" value={campana} />
                  </div>
                )}
              </div>

              <div
                className="px-6 pb-5 pt-2 border-t flex items-center gap-3"
                style={{ borderColor: "#F0EDE6" }}
              >
                <button
                  onClick={() => showToast("Próximamente")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
                >
                  <Building2 size={14} />
                  Agregar empresa
                </button>
                <button
                  onClick={() => showToast("Próximamente")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
                >
                  <UserPlus size={14} />
                  Invitar usuario
                </button>
              </div>
            </div>

            {/* ── Datos de la cuenta ── */}
            <div
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: "#E8E5DE" }}
            >
              <div className="px-6 pt-6 pb-4">
                <SectionHeader
                  icon={User}
                  title="Datos de la cuenta"
                  subtitle="Información del usuario actual"
                />
                <div
                  className="rounded-lg px-4 py-4 text-sm"
                  style={{ backgroundColor: "#FAFAF8", color: "#9B9488" }}
                >
                  Próximamente: gestión de usuarios, contraseña y perfil.
                </div>
              </div>
            </div>

            {/* ── Plan ── */}
            <div
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: "#E8E5DE" }}
            >
              <div className="px-6 pt-6 pb-5">
                <SectionHeader
                  icon={CreditCard}
                  title="Plan y facturación"
                  subtitle="Gestión de suscripción"
                />
                <div
                  className="flex items-center justify-between rounded-lg px-4 py-4 border cursor-pointer group transition-colors hover:border-green-300"
                  style={{ borderColor: "#E8E5DE", backgroundColor: "#FAFAF8" }}
                  onClick={() => showToast("Próximamente")}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Plan Demo</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Acceso completo durante el período de prueba</p>
                  </div>
                  <ChevronRight size={16} style={{ color: "#9B9488" }} className="group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

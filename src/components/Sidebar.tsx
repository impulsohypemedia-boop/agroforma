"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, FileText, BarChart2, MessageSquare,
  Settings, LayoutGrid, Sprout, Beef, ChevronDown, Building2, Check, Plus, Layers, FlaskConical, MonitorPlay, LogOut, Wallet
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import NuevaEmpresaModal from "@/components/NuevaEmpresaModal";

const navItemsTop = [
  { label: "Dashboard",  icon: LayoutDashboard, href: "/"         },
  { label: "Documentos", icon: FileText,         href: "/docs"    },
  { label: "Reportes",   icon: BarChart2,        href: "/reportes"},
  { label: "Escenarios", icon: FlaskConical,     href: "/escenarios" },
];

const navItemsBottom = [
  { label: "Asistente", icon: MessageSquare, href: "/chat" },
];

const disabledItems = [
  { label: "Inversiones", icon: Wallet, tooltip: "Próximamente: seguimiento de FCIs, bonos, plazos fijos y cauciones" },
  { label: "Presentaciones", icon: MonitorPlay, tooltip: "Esta función estará disponible próximamente" },
];

const gestionSubItems = [
  { label: "Agrícola",  icon: Sprout, href: "/gestion/agricola" },
  { label: "Ganadera",  icon: Beef,   href: "/gestion/ganadera" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isGestionActive = pathname.startsWith("/gestion");
  const [gestionOpen, setGestionOpen] = useState(isGestionActive);
  const [empresaDropOpen, setEmpresaDropOpen] = useState(false);
  const [nuevaEmpresaOpen, setNuevaEmpresaOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { empresas, empresaActiva, cambiarEmpresa } = useAppContext();
  const { user } = useAuth();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  useEffect(() => { if (isGestionActive) setGestionOpen(true); }, [isGestionActive]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setEmpresaDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <>
      <aside className="flex flex-col h-screen shrink-0" style={{ width: 240, backgroundColor: "#1A3311" }}>
        {/* Logo + Empresa Selector */}
        <div className="px-5 pt-7 pb-4 border-b border-white/10">
          <Link href="/">
            <div className="flex items-baseline gap-2 cursor-pointer mb-3">
              <span className="text-2xl text-white tracking-tight select-none" style={{ fontFamily: "var(--font-fraunces)" }}>
                AgroForma<span style={{ color: "#D4AD3C" }}>.</span>
              </span>
              <span className="text-[9px] font-bold tracking-wider select-none" style={{ color: "#D4AD3C", opacity: 0.85 }}>IA</span>
            </div>
          </Link>

          {/* Empresa selector */}
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setEmpresaDropOpen(v => !v)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <Building2 size={13} className="shrink-0" style={{ color: "#D4AD3C" }} />
              <span className="flex-1 text-left text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.70)" }}>
                {empresaActiva?.nombre ?? (empresas.length === 0 ? "Sin empresa" : empresas[0]?.nombre)}
              </span>
              <ChevronDown
                size={12}
                className={`shrink-0 transition-transform text-white/40 group-hover:text-white/60 ${empresaDropOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {empresaDropOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Empresa list */}
                <div className="py-1 max-h-48 overflow-y-auto">
                  {empresas.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400">No hay empresas creadas</p>
                  ) : (
                    empresas.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => { cambiarEmpresa(emp.id); setEmpresaDropOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{emp.nombre}</p>
                          {emp.cuit && <p className="text-xs text-gray-400 truncate">{emp.cuit}</p>}
                        </div>
                        {emp.id === empresaActiva?.id && <Check size={14} style={{ color: "#3D7A1C" }} className="shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
                {/* Nueva empresa */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => { setEmpresaDropOpen(false); setNuevaEmpresaOpen(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                    style={{ color: "#3D7A1C" }}
                  >
                    <Plus size={15} />
                    Nueva empresa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {/* Dashboard, Documentos, Reportes, Escenarios */}
          {navItemsTop.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}>
                  <Icon size={18} className={active ? "text-white" : "text-white/55"} />
                  {item.label}
                </div>
              </Link>
            );
          })}

          {/* Portfolio — always visible */}
          <Link href="/portfolio">
            <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${pathname === "/portfolio" ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}>
              <Layers size={18} className={pathname === "/portfolio" ? "text-white" : "text-white/55"} />
              Portfolio
            </div>
          </Link>

          {/* Asistente */}
          {navItemsBottom.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}>
                  <Icon size={18} className={active ? "text-white" : "text-white/55"} />
                  {item.label}
                </div>
              </Link>
            );
          })}

          {/* Gestión collapsible */}
          <div>
            <button
              onClick={() => setGestionOpen(v => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-white/55 hover:bg-white/8 hover:text-white/80"
            >
              <LayoutGrid size={18} className="text-white/55" />
              <span className="flex-1 text-left">Gestión</span>
              <ChevronDown size={14} className={`transition-transform ${gestionOpen ? "rotate-180" : ""} text-white/40`} />
            </button>
            {gestionOpen && (
              <div className="mt-1 ml-3 space-y-0.5">
                {gestionSubItems.map((sub) => {
                  const Icon = sub.icon;
                  return (
                    <div
                      key={sub.label}
                      className="flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm cursor-not-allowed"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                      title="Esta función estará disponible próximamente"
                    >
                      <Icon size={15} />
                      <span className="flex-1">{sub.label}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }}
                      >
                        Próximamente
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Disabled items: Inversiones, Presentaciones */}
          {disabledItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed"
                style={{ color: "rgba(255,255,255,0.25)" }}
                title={item.tooltip}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }}
                >
                  Próximamente
                </span>
              </div>
            );
          })}

          {/* Configuración */}
          <Link href="/config">
            <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${pathname === "/config" ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}>
              <Settings size={18} className={pathname === "/config" ? "text-white" : "text-white/55"} />
              Configuración
            </div>
          </Link>
        </nav>

        {/* Footer — usuario + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          {user && (
            <div className="flex items-center gap-2 mb-2 px-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                style={{ backgroundColor: "#D4AD3C", color: "#1A3311" }}
              >
                {(user.user_metadata?.nombre_completo?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
              </div>
              <span className="text-xs truncate flex-1" style={{ color: "rgba(255,255,255,0.50)" }}>
                {user.user_metadata?.nombre_completo ?? user.email}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-colors cursor-pointer hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
          <p className="text-[10px] px-2 mt-1" style={{ color: "rgba(255,255,255,0.18)" }}>v0.4.0</p>
        </div>
      </aside>

      <NuevaEmpresaModal
        open={nuevaEmpresaOpen}
        onClose={() => setNuevaEmpresaOpen(false)}
      />
    </>
  );
}

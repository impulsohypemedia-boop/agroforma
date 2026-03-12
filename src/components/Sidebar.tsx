"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, FileText, BarChart2, MessageSquare,
  Settings, LayoutGrid, Sprout, Beef, ChevronDown, Building2, Check, Plus, Layers, FlaskConical, MonitorPlay
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import NuevaEmpresaModal from "@/components/NuevaEmpresaModal";

const navItems = [
  { label: "Dashboard",  icon: LayoutDashboard, href: "/"         },
  { label: "Documentos", icon: FileText,         href: "/docs"    },
  { label: "Reportes",   icon: BarChart2,        href: "/reportes"},
  { label: "Asistente",      icon: MessageSquare, href: "/chat"          },
  { label: "Presentaciones", icon: MonitorPlay,   href: "/presentaciones" },
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
          {navItems.map((item) => {
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

          {/* Escenarios */}
          <Link href="/escenarios">
            <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${pathname === "/escenarios" ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}>
              <FlaskConical size={18} className={pathname === "/escenarios" ? "text-white" : "text-white/55"} />
              Escenarios
            </div>
          </Link>

          {/* Portfolio — only when 2+ empresas */}
          {empresas.length >= 2 && (
            <Link href="/portfolio">
              <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${pathname === "/portfolio" ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}>
                <Layers size={18} className={pathname === "/portfolio" ? "text-white" : "text-white/55"} />
                Portfolio
              </div>
            </Link>
          )}

          {/* Gestión collapsible */}
          <div>
            <button
              onClick={() => setGestionOpen(v => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isGestionActive ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}
            >
              <LayoutGrid size={18} className={isGestionActive ? "text-white" : "text-white/55"} />
              <span className="flex-1 text-left">Gestión</span>
              <ChevronDown size={14} className={`transition-transform ${gestionOpen ? "rotate-180" : ""} ${isGestionActive ? "text-white" : "text-white/40"}`} />
            </button>
            {gestionOpen && (
              <div className="mt-1 ml-3 space-y-0.5">
                {gestionSubItems.map((sub) => {
                  const active = pathname === sub.href;
                  const Icon = sub.icon;
                  return (
                    <Link key={sub.label} href={sub.href}>
                      <div className={`flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${active ? "bg-white/15 text-white font-medium" : "text-white/45 hover:bg-white/8 hover:text-white/70"}`}>
                        <Icon size={15} />
                        {sub.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Configuración */}
          <Link href="/config">
            <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${pathname === "/config" ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}>
              <Settings size={18} className={pathname === "/config" ? "text-white" : "text-white/55"} />
              Configuración
            </div>
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10">
          <p className="text-xs text-white/30">v0.1.0</p>
        </div>
      </aside>

      <NuevaEmpresaModal
        open={nuevaEmpresaOpen}
        onClose={() => setNuevaEmpresaOpen(false)}
      />
    </>
  );
}

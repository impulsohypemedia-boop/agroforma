"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, FileText, BarChart2, MessageSquare, Settings, LayoutGrid, Sprout, Beef, ChevronDown } from "lucide-react";

const navItems = [
  { label: "Dashboard",  icon: LayoutDashboard, href: "/"         },
  { label: "Documentos", icon: FileText,         href: "/docs"    },
  { label: "Reportes",   icon: BarChart2,        href: "/reportes"},
  { label: "Asistente",  icon: MessageSquare,    href: "/chat"    },
];

const gestionSubItems = [
  { label: "Agrícola",  icon: Sprout, href: "/gestion/agricola" },
  { label: "Ganadera",  icon: Beef,   href: "/gestion/ganadera" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isGestionActive = pathname.startsWith("/gestion");
  const [gestionOpen, setGestionOpen] = useState(isGestionActive);

  // Auto-expand when navigating into gestión
  useEffect(() => {
    if (isGestionActive) setGestionOpen(true);
  }, [isGestionActive]);

  return (
    <aside
      className="flex flex-col h-screen shrink-0"
      style={{ width: 240, backgroundColor: "#1A3311" }}
    >
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10">
        <Link href="/">
          <div className="flex items-baseline gap-2 cursor-pointer">
            <span
              className="text-2xl text-white tracking-tight select-none"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              AgroForma<span style={{ color: "#D4AD3C" }}>.</span>
            </span>
            <span
              className="text-[9px] font-bold tracking-wider select-none"
              style={{ color: "#D4AD3C", opacity: 0.85 }}
            >
              IA
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <div
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}
                `}
              >
                <Icon size={18} className={active ? "text-white" : "text-white/55"} />
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* Gestión collapsible section */}
        <div>
          <button
            onClick={() => setGestionOpen((v) => !v)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
              ${isGestionActive ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}
            `}
          >
            <LayoutGrid size={18} className={isGestionActive ? "text-white" : "text-white/55"} />
            <span className="flex-1 text-left">Gestión</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${gestionOpen ? "rotate-180" : ""} ${isGestionActive ? "text-white" : "text-white/40"}`}
            />
          </button>

          {gestionOpen && (
            <div className="mt-1 ml-3 space-y-0.5">
              {gestionSubItems.map((sub) => {
                const active = pathname === sub.href;
                const Icon = sub.icon;
                return (
                  <Link key={sub.label} href={sub.href}>
                    <div
                      className={`
                        flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                        ${active ? "bg-white/15 text-white font-medium" : "text-white/45 hover:bg-white/8 hover:text-white/70"}
                      `}
                    >
                      <Icon size={15} />
                      {sub.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Configuración — always at bottom of nav */}
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
  );
}

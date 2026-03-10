"use client";

import { LayoutDashboard, FileText, BarChart2, Settings } from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, active: true },
  { label: "Documentos", icon: <FileText size={18} /> },
  { label: "Reportes", icon: <BarChart2 size={18} /> },
  { label: "Configuración", icon: <Settings size={18} /> },
];

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col h-screen shrink-0"
      style={{ width: 240, backgroundColor: "#1A3311" }}
    >
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10">
        <span
          className="text-2xl text-white tracking-tight select-none"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          AgroForma<span style={{ color: "#D4AD3C" }}>.</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
              ${
                item.active
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:bg-white/8 hover:text-white/80"
              }
            `}
          >
            <span className={item.active ? "text-white" : "text-white/55"}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-white/10">
        <p className="text-xs text-white/30">v0.1.0 — Solo interfaz</p>
      </div>
    </aside>
  );
}

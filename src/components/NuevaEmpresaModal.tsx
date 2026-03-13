"use client";
import { useState, useTransition } from "react";
import { X, Building2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Empresa, EmpresaFormData } from "@/types/empresa";
import { PROVINCIAS_ARG } from "@/types/gestion";

type Props = { open: boolean; onClose: () => void; onCreated?: (e: Empresa) => void };

export default function NuevaEmpresaModal({ open, onClose, onCreated }: Props) {
  const { crearEmpresa } = useAppContext();
  const [form, setForm] = useState<EmpresaFormData>({
    nombre: "", cuit: "", actividad: "mixta", provincia: "", localidad: "", campana: "2025/26",
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }
    startTransition(async () => {
      const nueva = await crearEmpresa(form);
      if (!nueva) { setError("Error al crear la empresa. Intentá de nuevo."); return; }
      onCreated?.(nueva);
      onClose();
      setForm({ nombre: "", cuit: "", actividad: "mixta", provincia: "", localidad: "", campana: "2025/26" });
      setError("");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#1A3311" }}>
              <Building2 size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Nueva empresa</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa *</label>
            <input
              type="text" required
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Iruya S.A."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#3D7A1C" } as React.CSSProperties}
            />
          </div>

          {/* CUIT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CUIT <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              type="text"
              value={form.cuit ?? ""}
              onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
              placeholder="20-12345678-9"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
            />
          </div>

          {/* Actividad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actividad</label>
            <select
              value={form.actividad}
              onChange={e => setForm(f => ({ ...f, actividad: e.target.value as EmpresaFormData["actividad"] }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
            >
              <option value="agricola">Agrícola</option>
              <option value="ganadera">Ganadera</option>
              <option value="mixta">Mixta</option>
            </select>
          </div>

          {/* Provincia + Localidad side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <select
                value={form.provincia ?? ""}
                onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
              >
                <option value="">Seleccionar...</option>
                {PROVINCIAS_ARG.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
              <input
                type="text"
                value={form.localidad ?? ""}
                onChange={e => setForm(f => ({ ...f, localidad: e.target.value }))}
                placeholder="Ej: Córdoba"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Campaña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaña activa</label>
            <input
              type="text"
              value={form.campana}
              onChange={e => setForm(f => ({ ...f, campana: e.target.value }))}
              placeholder="2025/26"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#1A3311" }}
            >
              {isPending ? "Creando…" : "Crear empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

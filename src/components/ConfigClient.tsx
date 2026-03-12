"use client";

import { useState } from "react";
import { Building2, UserPlus, User, CreditCard, ChevronRight, Trash2, Check, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import NuevaEmpresaModal from "@/components/NuevaEmpresaModal";
import { Empresa } from "@/types/empresa";
import { PROVINCIAS_ARG } from "@/types/gestion";

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  setTimeout(() => { setVisible(false); onDone(); }, 3000);

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

type EditForm = {
  nombre: string;
  cuit: string;
  actividad: Empresa["actividad"];
  provincia: string;
  localidad: string;
  campana: string;
};

function EmpresaCard({
  empresa,
  isActiva,
  onSwitch,
  onEdit,
  onDelete,
}: {
  empresa: Empresa;
  isActiva: boolean;
  onSwitch: () => void;
  onEdit: (data: Partial<Empresa>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<EditForm>({
    nombre: empresa.nombre,
    cuit: empresa.cuit ?? "",
    actividad: empresa.actividad,
    provincia: empresa.provincia ?? "",
    localidad: empresa.localidad ?? "",
    campana: empresa.campana,
  });

  const actividadLabel = { agricola: "Agrícola", ganadera: "Ganadera", mixta: "Mixta" }[empresa.actividad];

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onEdit({
      nombre: form.nombre,
      cuit: form.cuit || undefined,
      actividad: form.actividad,
      provincia: form.provincia || undefined,
      localidad: form.localidad || undefined,
      campana: form.campana,
    });
    setEditing(false);
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: isActiva ? "#3D7A1C" : "#E8E5DE", backgroundColor: "#FFFFFF" }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "#F0EDE6", backgroundColor: isActiva ? "#F5FAF3" : "#FAFAF8" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: isActiva ? "#EBF3E8" : "#F0EDE6" }}>
            <Building2 size={15} style={{ color: isActiva ? "#3D7A1C" : "#9B9488" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{empresa.nombre}</p>
            {empresa.cuit && <p className="text-xs" style={{ color: "#9B9488" }}>{empresa.cuit}</p>}
          </div>
          {isActiva && (
            <span className="ml-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}>
              Activa
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isActiva && (
            <button
              onClick={onSwitch}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50 cursor-pointer"
              style={{ borderColor: "#D6D1C8", color: "#3D7A1C" }}
            >
              Activar
            </button>
          )}
          <button
            onClick={() => { setEditing(v => !v); setConfirmDelete(false); }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50 cursor-pointer"
            style={{ borderColor: "#D6D1C8", color: "#6B6560" }}
          >
            {editing ? "Cancelar" : "Editar"}
          </button>
        </div>
      </div>

      {/* Body */}
      {!editing ? (
        <div className="px-5 py-3">
          <DataRow label="Actividad" value={actividadLabel} />
          <DataRow label="Provincia" value={empresa.provincia ?? null} />
          <DataRow label="Localidad" value={empresa.localidad ?? null} />
          <DataRow label="Campaña" value={empresa.campana} />

          {/* Delete zone */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "#F0EDE6" }}>
            {confirmDelete ? (
              <div className="flex items-center gap-3 w-full">
                <p className="text-xs text-red-600 flex-1">¿Eliminar esta empresa y todos sus datos?</p>
                <button
                  onClick={() => { setConfirmDelete(false); onDelete(); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white cursor-pointer"
                  style={{ backgroundColor: "#C0392B" }}
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-gray-50"
                  style={{ borderColor: "#D6D1C8", color: "#6B6560" }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors"
                style={{ color: "#B0A99F" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#C0392B")}
                onMouseLeave={e => (e.currentTarget.style.color = "#B0A99F")}
              >
                <Trash2 size={13} />
                Eliminar empresa
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: "#6B6560" }}>Nombre *</label>
              <input
                required type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6B6560" }}>CUIT</label>
              <input
                type="text"
                value={form.cuit}
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                placeholder="20-12345678-9"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6B6560" }}>Actividad</label>
              <select
                value={form.actividad}
                onChange={e => setForm(f => ({ ...f, actividad: e.target.value as Empresa["actividad"] }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
              >
                <option value="agricola">Agrícola</option>
                <option value="ganadera">Ganadera</option>
                <option value="mixta">Mixta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6B6560" }}>Provincia</label>
              <select
                value={form.provincia}
                onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
              >
                <option value="">Seleccionar...</option>
                {PROVINCIAS_ARG.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6B6560" }}>Localidad</label>
              <input
                type="text"
                value={form.localidad}
                onChange={e => setForm(f => ({ ...f, localidad: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6B6560" }}>Campaña</label>
              <input
                type="text"
                value={form.campana}
                onChange={e => setForm(f => ({ ...f, campana: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-50"
              style={{ borderColor: "#D6D1C8", color: "#6B6560" }}
            >
              <X size={13} /> Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: "#1A3311" }}
            >
              <Check size={13} /> Guardar cambios
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ConfigClient() {
  const { empresas, empresaActivaId, cambiarEmpresa, editarEmpresa, eliminarEmpresa } = useAppContext();
  const [toast, setToast] = useState<string | null>(null);
  const [nuevaEmpresaOpen, setNuevaEmpresaOpen] = useState(false);

  const showToast = (msg: string) => setToast(msg);

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
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Gestión de empresas y cuenta</p>
            </div>
          </header>

          <main className="px-8 py-7 max-w-2xl space-y-6">

            {/* ── Mis empresas ── */}
            <div
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: "#E8E5DE" }}
            >
              <div className="px-6 pt-6 pb-4">
                <SectionHeader
                  icon={Building2}
                  title="Mis empresas"
                  subtitle="Gestioná las empresas asociadas a tu cuenta"
                />

                {empresas.length === 0 ? (
                  <div
                    className="rounded-lg px-4 py-4 text-sm border"
                    style={{ backgroundColor: "#FFFBEB", borderColor: "#F5D87A", color: "#92680A" }}
                  >
                    No hay empresas creadas. Creá tu primera empresa para comenzar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {empresas.map(emp => (
                      <EmpresaCard
                        key={emp.id}
                        empresa={emp}
                        isActiva={emp.id === empresaActivaId}
                        onSwitch={() => cambiarEmpresa(emp.id)}
                        onEdit={(data) => { editarEmpresa(emp.id, data); showToast("Empresa actualizada"); }}
                        onDelete={() => { eliminarEmpresa(emp.id); showToast("Empresa eliminada"); }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div
                className="px-6 pb-5 pt-2 border-t flex items-center gap-3"
                style={{ borderColor: "#F0EDE6" }}
              >
                <button
                  onClick={() => setNuevaEmpresaOpen(true)}
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

      <NuevaEmpresaModal
        open={nuevaEmpresaOpen}
        onClose={() => setNuevaEmpresaOpen(false)}
        onCreated={() => showToast("Empresa creada")}
      />

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

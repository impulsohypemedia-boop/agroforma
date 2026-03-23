"use client";
import { useState, useEffect } from "react";
import { Layers, TrendingUp, BarChart2, Sparkles, Download, RefreshCw, Trophy, Medal, Award, Building2 } from "lucide-react";
import NuevaEmpresaModal from "@/components/NuevaEmpresaModal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import { Empresa } from "@/types/empresa";
import { GeneratedReport } from "@/types/report";

// ── Types ────────────────────────────────────────────────────────────────────

type MetricsMap = {
  ventas_netas: number | null;
  resultado_neto: number | null;
  patrimonio_neto: number | null;
  margen_bruto_pct: number | null;
  margen_neto_pct: number | null;
  roe_pct: number | null;
  roa_pct: number | null;
  liquidez_corriente: number | null;
  endeudamiento: number | null;
  total_activo: number | null;
  total_pasivo: number | null;
};

type EmpresaData = {
  empresa: Empresa;
  reports: GeneratedReport[];
  metrics: MetricsMap;
};

type TabId = "benchmark" | "ranking" | "consolidado" | "ia";

type AIAnalysis = {
  empresas_analizadas: number;
  benchmark: Array<{
    indicador: string;
    valores: Record<string, number | null>;
    mejor: string;
    peor: string;
    promedio: number | null;
  }>;
  insights_cruzados: string[];
  oportunidades: string[];
  riesgos_grupo: string[];
  resumen: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

const EMPRESA_COLORS = ["#3D7A1C", "#B8922A", "#2563EB", "#7C3AED", "#DC2626", "#0891B2", "#059669", "#EA580C"];

const METRIC_DEFS: { key: keyof MetricsMap; label: string; format: "currency" | "percent" | "ratio" }[] = [
  { key: "ventas_netas",       label: "Ventas Netas",        format: "currency" },
  { key: "resultado_neto",     label: "Resultado Neto",      format: "currency" },
  { key: "patrimonio_neto",    label: "Patrimonio Neto",     format: "currency" },
  { key: "total_activo",       label: "Total Activo",        format: "currency" },
  { key: "total_pasivo",       label: "Total Pasivo",        format: "currency" },
  { key: "margen_bruto_pct",   label: "Margen Bruto %",      format: "percent"  },
  { key: "margen_neto_pct",    label: "Margen Neto %",       format: "percent"  },
  { key: "roe_pct",            label: "ROE %",               format: "percent"  },
  { key: "roa_pct",            label: "ROA %",               format: "percent"  },
  { key: "liquidez_corriente", label: "Liquidez Corriente",  format: "ratio"    },
  { key: "endeudamiento",      label: "Endeudamiento",       format: "ratio"    },
];

// ── Module-level helpers ─────────────────────────────────────────────────────

function extractMetrics(reports: GeneratedReport[]): MetricsMap {
  const m: MetricsMap = {
    ventas_netas: null, resultado_neto: null, patrimonio_neto: null,
    margen_bruto_pct: null, margen_neto_pct: null, roe_pct: null, roa_pct: null,
    liquidez_corriente: null, endeudamiento: null, total_activo: null, total_pasivo: null,
  };

  const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  for (const report of reports) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = report.data as Record<string, any>;
    if (!d) continue;

    if (report.reportId === "situacion-patrimonial") {
      m.ventas_netas      = toNum(d.ventas_netas) ?? m.ventas_netas;
      m.resultado_neto    = toNum(d.resultado_neto) ?? m.resultado_neto;
      m.patrimonio_neto   = toNum(d.patrimonio_neto) ?? m.patrimonio_neto;
      m.total_activo      = toNum(d.total_activo) ?? m.total_activo;
      m.total_pasivo      = toNum(d.total_pasivo) ?? m.total_pasivo;
    }

    if (report.reportId === "margen-bruto") {
      m.ventas_netas      = m.ventas_netas ?? toNum(d.total_ventas_actual);
      m.margen_bruto_pct  = toNum(d.margen_bruto_pct_actual) ?? toNum(d.margen_bruto_pct) ?? m.margen_bruto_pct;
    }

    if (report.reportId === "ratios") {
      m.margen_bruto_pct  = m.margen_bruto_pct ?? toNum(d.margen_bruto_pct);
      m.margen_neto_pct   = toNum(d.margen_neto_pct) ?? m.margen_neto_pct;
      m.roe_pct           = toNum(d.roe_pct) ?? m.roe_pct;
      m.roa_pct           = toNum(d.roa_pct) ?? m.roa_pct;
      m.liquidez_corriente = toNum(d.liquidez_corriente) ?? m.liquidez_corriente;
      m.endeudamiento     = toNum(d.endeudamiento) ?? m.endeudamiento;
      // Try nested filas structure
      const filas: Array<{ ratio: string; valores: number[] }> = d.ratios?.filas ?? d.filas ?? [];
      for (const fila of filas) {
        const v = toNum(fila.valores?.[0]);
        const r = fila.ratio?.toLowerCase() ?? "";
        if (r.includes("margen bruto"))     m.margen_bruto_pct  = m.margen_bruto_pct  ?? v;
        if (r.includes("margen neto"))      m.margen_neto_pct   = m.margen_neto_pct   ?? v;
        if (r.includes("roe"))              m.roe_pct           = m.roe_pct           ?? v;
        if (r.includes("roa"))              m.roa_pct           = m.roa_pct           ?? v;
        if (r.includes("liquidez"))         m.liquidez_corriente = m.liquidez_corriente ?? v;
        if (r.includes("endeudamiento"))    m.endeudamiento     = m.endeudamiento     ?? v;
      }
    }
  }
  return m;
}

function loadAllEmpresasData(empresas: Empresa[]): EmpresaData[] {
  return empresas.map(empresa => {
    try {
      const raw = localStorage.getItem(`agroforma_empresa_${empresa.id}_reports`);
      const reports: GeneratedReport[] = raw ? JSON.parse(raw) : [];
      return { empresa, reports, metrics: extractMetrics(reports) };
    } catch {
      return { empresa, reports: [], metrics: extractMetrics([]) };
    }
  });
}

function fmtCurrency(n: number | null): string {
  if (n === null) return "—";
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function fmtMetric(n: number | null, format: "currency" | "percent" | "ratio"): string {
  if (n === null) return "—";
  if (format === "currency") return fmtCurrency(n);
  if (format === "percent")  return `${n.toFixed(1)}%`;
  if (format === "ratio")    return n.toFixed(2) + "x";
  return String(n);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function BenchmarkTab({ allData }: { allData: EmpresaData[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-xl overflow-hidden border" style={{ borderColor: "#E8E5DE" }}>
        <thead>
          <tr style={{ backgroundColor: "#1A3311" }}>
            <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider w-48">Indicador</th>
            {allData.map((d, i) => (
              <th key={d.empresa.id} className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: EMPRESA_COLORS[i % EMPRESA_COLORS.length] }}>
                {d.empresa.nombre}
              </th>
            ))}
            <th className="text-right px-5 py-3 text-xs font-semibold text-white/60 uppercase tracking-wider">Promedio</th>
          </tr>
        </thead>
        <tbody>
          {METRIC_DEFS.map((m, idx) => {
            const vals = allData.map(d => d.metrics[m.key]);
            const numVals = vals.filter(v => v !== null) as number[];
            const best   = numVals.length > 0 ? Math.max(...numVals) : null;
            const worst  = numVals.length > 0 ? Math.min(...numVals) : null;
            const avg    = numVals.length > 0 ? numVals.reduce((a, b) => a + b, 0) / numVals.length : null;

            return (
              <tr key={m.key} style={{ backgroundColor: idx % 2 === 0 ? "#FAFAF8" : "#FFFFFF", borderTop: "1px solid #F0EDE6" }}>
                <td className="px-5 py-3 text-sm font-semibold" style={{ color: "#1A1A1A" }}>{m.label}</td>
                {vals.map((v, vi) => {
                  const isBest  = v !== null && v === best  && numVals.length > 1;
                  const isWorst = v !== null && v === worst && numVals.length > 1;
                  return (
                    <td key={vi} className="px-5 py-3 text-sm text-right font-medium"
                      style={{
                        color: isBest ? "#1E7E34" : isWorst ? "#C0392B" : "#1A1A1A",
                        backgroundColor: isBest ? "#D4EDDA" : isWorst ? "#F8D7DA" : undefined,
                      }}
                    >
                      {fmtMetric(v, m.format)}
                      {isBest  && <span className="ml-1 text-[10px]">▲</span>}
                      {isWorst && <span className="ml-1 text-[10px]">▼</span>}
                    </td>
                  );
                })}
                <td className="px-5 py-3 text-sm text-right" style={{ color: "#9B9488" }}>
                  {fmtMetric(avg, m.format)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs mt-3" style={{ color: "#9B9488" }}>
        ▲ mejor del grupo · ▼ peor del grupo · — sin datos suficientes
      </p>
    </div>
  );
}

function RankingTab({ allData, rankMetric, setRankMetric }: {
  allData: EmpresaData[];
  rankMetric: keyof MetricsMap;
  setRankMetric: (m: keyof MetricsMap) => void;
}) {
  const metricDef = METRIC_DEFS.find(m => m.key === rankMetric)!;
  const ranked = [...allData]
    .filter(d => d.metrics[rankMetric] !== null)
    .sort((a, b) => (b.metrics[rankMetric] ?? 0) - (a.metrics[rankMetric] ?? 0));
  const maxVal = ranked[0]?.metrics[rankMetric] ?? 1;

  const medals = [
    <Trophy key="gold"   size={18} color="#D4AD3C" />,
    <Medal  key="silver" size={18} color="#9B9488" />,
    <Award  key="bronze" size={18} color="#B8922A" />,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Rankear por:</span>
        <select
          value={rankMetric}
          onChange={e => setRankMetric(e.target.value as keyof MetricsMap)}
          className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none"
          style={{ borderColor: "#D6D1C8" }}
        >
          {METRIC_DEFS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
        {ranked.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <p className="text-sm" style={{ color: "#9B9488" }}>Ninguna empresa tiene datos para este indicador</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F0EDE6" }}>
            {ranked.map((d, i) => {
              const val   = d.metrics[rankMetric] ?? 0;
              const pct   = maxVal !== 0 ? Math.abs(val / maxVal) * 100 : 0;
              const color = EMPRESA_COLORS[allData.indexOf(d) % EMPRESA_COLORS.length];
              return (
                <div key={d.empresa.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-8 flex justify-center">
                    {i < 3 ? medals[i] : <span className="text-sm font-bold" style={{ color: "#9B9488" }}>{i + 1}</span>}
                  </div>
                  <div className="w-36 shrink-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1A1A1A" }}>{d.empresa.nombre}</p>
                    {d.empresa.provincia && <p className="text-xs" style={{ color: "#9B9488" }}>{d.empresa.provincia}</p>}
                  </div>
                  <div className="flex-1">
                    <div className="h-7 rounded-lg overflow-hidden" style={{ backgroundColor: "#F0EDE6" }}>
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>
                      {fmtMetric(d.metrics[rankMetric], metricDef.format)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ConsolidadoTab({ allData, consolidado }: {
  allData: EmpresaData[];
  consolidado: Record<string, number>;
}) {
  const ventasData = allData
    .filter(d => d.metrics.ventas_netas !== null && d.metrics.ventas_netas > 0)
    .map((d, i) => ({
      name: d.empresa.nombre,
      value: d.metrics.ventas_netas ?? 0,
      fill: EMPRESA_COLORS[i % EMPRESA_COLORS.length],
    }));

  const resultadoData = allData.map((d, i) => ({
    name: d.empresa.nombre,
    value: d.metrics.resultado_neto ?? 0,
    fill: (d.metrics.resultado_neto ?? 0) >= 0 ? EMPRESA_COLORS[i % EMPRESA_COLORS.length] : "#C0392B",
  }));

  const kpis = [
    { label: "Ventas Totales",  value: consolidado.ventas_netas,    color: "#3D7A1C" },
    { label: "Resultado Neto",  value: consolidado.resultado_neto,   color: (consolidado.resultado_neto ?? 0) >= 0 ? "#3D7A1C" : "#C0392B" },
    { label: "Patrimonio Neto", value: consolidado.patrimonio_neto,  color: "#B8922A" },
    { label: "Total Activos",   value: consolidado.total_activo,     color: "#2563EB" },
    { label: "Total Pasivos",   value: consolidado.total_pasivo,     color: "#9B9488" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm" style={{ color: "#B8922A" }}>
        <strong>Nota:</strong> Consolidado simplificado — no contempla eliminaciones intercompany ni ajustes de consolidación.
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#E8E5DE" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#9B9488" }}>{k.label}</p>
            <p className="text-base font-bold" style={{ color: k.color }}>{fmtCurrency(k.value ?? null)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pie: participación en ventas */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E8E5DE" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "#1A1A1A" }}>Participación en Ventas</p>
          {ventasData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#9B9488" }}>Sin datos de ventas</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ventasData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {ventasData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtCurrency(typeof v === "number" ? v : null)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: resultado neto por empresa */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E8E5DE" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "#1A1A1A" }}>Resultado Neto por Empresa</p>
          {resultadoData.every(d => d.value === 0) ? (
            <p className="text-sm text-center py-8" style={{ color: "#9B9488" }}>Sin datos de resultado</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resultadoData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : String(v)}
                />
                <Tooltip formatter={(v) => fmtCurrency(typeof v === "number" ? v : null)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {resultadoData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function IATab({ aiAnalysis, analyzing, onAnalyze }: {
  aiAnalysis: AIAnalysis | null;
  analyzing: boolean;
  onAnalyze: () => void;
}) {
  if (!aiAnalysis && !analyzing) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#EBF3E8" }}>
          <Sparkles size={24} style={{ color: "#3D7A1C" }} />
        </div>
        <h3 className="text-base font-semibold" style={{ color: "#1A1A1A" }}>Análisis de Portfolio con IA</h3>
        <p className="text-sm text-center max-w-sm" style={{ color: "#9B9488" }}>
          Claude analiza los datos de todas tus empresas, detecta patrones, oportunidades de optimización y riesgos del grupo.
        </p>
        <button
          onClick={onAnalyze}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ backgroundColor: "#1A3311" }}
        >
          <Sparkles size={15} />
          Analizar Portfolio
        </button>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <RefreshCw size={28} className="animate-spin" style={{ color: "#3D7A1C" }} />
        <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Analizando portfolio…</p>
        <p className="text-xs" style={{ color: "#9B9488" }}>Claude está cruzando los datos de todas las empresas</p>
      </div>
    );
  }

  if (!aiAnalysis) return null;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#C8E6C0", backgroundColor: "#F7FBF5" }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: "#3D7A1C" }} />
          <p className="text-sm font-bold" style={{ color: "#1A3311" }}>Resumen ejecutivo</p>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D4AD3C", color: "#1A1A1A", fontWeight: 600 }}>
            {aiAnalysis.empresas_analizadas} empresa{aiAnalysis.empresas_analizadas !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#2D4A1E" }}>{aiAnalysis.resumen}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Insights */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E8E5DE" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: "#2563EB" }} />
            <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>Insights cruzados</p>
          </div>
          <div className="space-y-3">
            {(aiAnalysis.insights_cruzados ?? []).map((ins, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}>{i + 1}</span>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>{ins}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidades */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E8E5DE" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} style={{ color: "#3D7A1C" }} />
            <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>Oportunidades</p>
          </div>
          <div className="space-y-3">
            {(aiAnalysis.oportunidades ?? []).map((op, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-bold" style={{ color: "#D4AD3C" }}>→</span>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>{op}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Riesgos */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#FBCFCF", backgroundColor: "#FFF5F5" }}>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm font-bold" style={{ color: "#C0392B" }}>⚠ Riesgos del grupo</p>
        </div>
        <div className="space-y-2">
          {(aiAnalysis.riesgos_grupo ?? []).map((r, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-xs font-bold shrink-0" style={{ color: "#C0392B" }}>!</span>
              <p className="text-sm leading-relaxed" style={{ color: "#7B1E1E" }}>{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PortfolioClient() {
  const { empresas } = useAppContext();
  const [tab, setTab]                   = useState<TabId>("benchmark");
  const [rankMetric, setRankMetric]     = useState<keyof MetricsMap>("ventas_netas");
  const [allData, setAllData]           = useState<EmpresaData[]>([]);
  const [aiAnalysis, setAiAnalysis]     = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [aiError, setAiError]           = useState<string | null>(null);
  const [downloading, setDownloading]   = useState(false);

  useEffect(() => {
    if (empresas.length > 0) {
      setAllData(loadAllEmpresasData(empresas));
    }
  }, [empresas]);

  const [nuevaEmpresaOpen, setNuevaEmpresaOpen] = useState(false);

  // If < 2 empresas, show empty state with create button
  if (empresas.length < 2) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#EBF3E8" }}>
              <Building2 size={28} style={{ color: "#3D7A1C" }} />
            </div>
            <h2 className="text-xl font-bold mb-3" style={{ color: "#1A1A1A" }}>Portfolio</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#9B9488" }}>
              Creá otra empresa y subile documentación para comparar el rendimiento entre tus empresas.
              El portfolio te permite ver benchmarks, rankings y análisis comparativo.
            </p>
            <button
              onClick={() => setNuevaEmpresaOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#3D7A1C" }}
            >
              <Building2 size={16} />
              Crear empresa
            </button>
          </div>
        </div>
        <NuevaEmpresaModal open={nuevaEmpresaOpen} onClose={() => setNuevaEmpresaOpen(false)} />
      </div>
    );
  }

  // Consolidado totals
  const consolidado = {
    ventas_netas:    allData.reduce((s, d) => s + (d.metrics.ventas_netas ?? 0), 0),
    resultado_neto:  allData.reduce((s, d) => s + (d.metrics.resultado_neto ?? 0), 0),
    patrimonio_neto: allData.reduce((s, d) => s + (d.metrics.patrimonio_neto ?? 0), 0),
    total_activo:    allData.reduce((s, d) => s + (d.metrics.total_activo ?? 0), 0),
    total_pasivo:    allData.reduce((s, d) => s + (d.metrics.total_pasivo ?? 0), 0),
  };

  async function handleAnalyze() {
    setAnalyzing(true);
    setAiError(null);
    try {
      const empresasData = allData.map(d => ({
        empresa: d.empresa.nombre,
        metrics: d.metrics,
        reportes_disponibles: d.reports.map(r => r.reportId),
      }));
      const res = await fetch("/api/portfolio/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresasData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAiAnalysis(json.data);
      setTab("ia");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/portfolio/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresas: allData.map(d => ({ nombre: d.empresa.nombre, metrics: d.metrics })),
          consolidado,
          aiAnalysis: aiAnalysis ?? null,
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `portfolio-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setDownloading(false); }
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: "benchmark",   label: "Benchmark"   },
    { id: "ranking",     label: "Ranking"     },
    { id: "consolidado", label: "Consolidado" },
    { id: "ia",          label: aiAnalysis ? "Análisis IA ✓" : "Análisis IA" },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: "#E8E5DE" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#1A3311" }}>
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Portfolio</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                {allData.length} empresa{allData.length !== 1 ? "s" : ""} · comparación y análisis cruzado
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity text-white cursor-pointer"
              style={{ backgroundColor: "#1A3311", opacity: analyzing ? 0.7 : 1 }}
            >
              {analyzing ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {analyzing ? "Analizando…" : "Analizar Portfolio"}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors hover:bg-gray-50"
              style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
            >
              <Download size={15} />
              {downloading ? "Generando…" : "Descargar Excel"}
            </button>
          </div>
        </header>

        {/* Empresa legend */}
        <div className="flex items-center gap-4 px-8 pt-5 flex-wrap">
          {allData.map((d, i) => (
            <div key={d.empresa.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EMPRESA_COLORS[i % EMPRESA_COLORS.length] }} />
              <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{d.empresa.nombre}</span>
              {d.empresa.cuit && <span className="text-xs" style={{ color: "#9B9488" }}>{d.empresa.cuit}</span>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-8 pt-4 pb-0 border-b" style={{ borderColor: "#E8E5DE" }}>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer border-b-2"
                style={{
                  borderBottomColor: tab === t.id ? "#3D7A1C" : "transparent",
                  color: tab === t.id ? "#3D7A1C" : "#9B9488",
                  backgroundColor: tab === t.id ? "#F0F9EC" : "transparent",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <main className="px-8 py-7 max-w-6xl">
          {aiError && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between" style={{ backgroundColor: "#FEE9E9", color: "#C0392B", border: "1px solid #FBCFCF" }}>
              <span>{aiError}</span>
              <button onClick={() => setAiError(null)} className="ml-4 font-bold cursor-pointer">×</button>
            </div>
          )}

          {tab === "benchmark"   && <BenchmarkTab allData={allData} />}
          {tab === "ranking"     && <RankingTab allData={allData} rankMetric={rankMetric} setRankMetric={setRankMetric} />}
          {tab === "consolidado" && <ConsolidadoTab allData={allData} consolidado={consolidado} />}
          {tab === "ia"          && <IATab aiAnalysis={aiAnalysis} analyzing={analyzing} onAnalyze={handleAnalyze} />}
        </main>
      </div>
    </div>
  );
}

"use client";

import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie,
  LineChart, Line,
  AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ReferenceLine,
} from "recharts";

// ─── Brand colours ────────────────────────────────────────────────────────────
const C = {
  darkGreen:  "#1A3311",
  green:      "#3D7A1C",
  lightGreen: "#6AAF3C",
  mint:       "#A8D5A0",
  earth:      "#B8922A",
  gold:       "#D4AD3C",
  cream:      "#F9F8F4",
  red:        "#C0392B",
  lightRed:   "#E74C3C",
  gray:       "#9B9488",
  text:       "#1A1A1A",
};

const PIE_COLORS = [C.darkGreen, C.green, C.gold, C.earth, C.lightGreen, C.mint, "#5B8DD9", "#8E44AD"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toNum(v: unknown): number {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string") { const p = parseFloat(v.replace(/\./g, "").replace(",", ".")); return isNaN(p) ? 0 : p; }
  return 0;
}

function fmtARS(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v / 1_000_000_000) + " B";
  if (Math.abs(v) >= 1_000_000) return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v / 1_000_000) + " M";
  if (Math.abs(v) >= 1_000) return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v / 1_000) + " K";
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

function fmtFull(v: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: C.darkGreen, color: "#fff", borderRadius: 10,
      padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      minWidth: 160,
    }}>
      {label && <p style={{ fontWeight: 700, marginBottom: 6, color: C.mint }}>{label}</p>}
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
          <span style={{ color: p.color ?? C.mint }}>{p.name}</span>
          <span style={{ fontWeight: 700 }}>
            {unit === "%" ? `${fmtFull(p.value)}%` : fmtARS(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{
      backgroundColor: C.darkGreen, color: "#fff", borderRadius: 10,
      padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    }}>
      <p style={{ fontWeight: 700, color: C.mint, marginBottom: 4 }}>{p.name}</p>
      <p style={{ fontWeight: 700 }}>{fmtARS(p.value)} ({fmtFull(p.payload.pct ?? p.percent * 100)}%)</p>
    </div>
  );
}

// ─── Shared section title ──────────────────────────────────────────────────────
function ChartTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontWeight: 700, fontSize: 12, color: C.darkGreen, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </p>
  );
}

function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: "#fff", borderRadius: 16, padding: "20px 20px 12px",
      border: `1px solid #E8E5DE`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    }}>
      {children}
    </div>
  );
}

// ─── KPI indicator card ───────────────────────────────────────────────────────
function KpiIndicator({ label, value, prev, format = "ars" }: {
  label: string; value: number; prev?: number; format?: "ars" | "pct";
}) {
  const diff = prev !== undefined ? value - prev : null;
  const pct  = prev && prev !== 0 ? ((value - prev) / Math.abs(prev)) * 100 : null;
  const up    = diff !== null ? diff >= 0 : null;
  const fmt   = format === "pct" ? `${fmtFull(value)}%` : fmtARS(value);
  const fmtP  = format === "pct" ? `${fmtFull(prev ?? 0)}%` : fmtARS(prev ?? 0);

  return (
    <div style={{
      backgroundColor: "#fff", borderRadius: 16, padding: "20px 24px",
      border: "1px solid #E8E5DE", boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.gray }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: C.darkGreen, margin: 0 }}>{fmt}</p>
      {prev !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, color: up ? C.green : C.red }}>{up ? "↑" : "↓"}</span>
          <span style={{ fontSize: 12, color: up ? C.green : C.red, fontWeight: 700 }}>
            {pct !== null ? `${up ? "+" : ""}${fmtFull(pct)}%` : ""}
          </span>
          <span style={{ fontSize: 11, color: C.gray }}>vs {fmtP}</span>
        </div>
      )}
    </div>
  );
}

// ─── Gauge semicircle ──────────────────────────────────────────────────────────
function Gauge({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const r = 70; const cx = 90; const cy = 90;
  const startAngle = Math.PI;
  const endAngle   = 0;
  const angle = startAngle + pct * (endAngle - startAngle);
  const arc = (a: number) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  });
  const start = arc(startAngle);
  const end   = arc(endAngle);
  const curr  = arc(angle);
  const color = pct < 0.4 ? C.red : pct < 0.7 ? C.gold : C.green;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={180} height={100} viewBox="0 0 180 100">
        {/* background arc */}
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
          fill="none" stroke="#E8E5DE" strokeWidth={14} strokeLinecap="round"
        />
        {/* value arc */}
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${pct > 0.5 ? 0 : 0} 1 ${curr.x} ${curr.y}`}
          fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
        />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={22} fontWeight={800} fill={color}>
          {Math.round(value)}{max === 100 ? "%" : ""}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize={10} fill={C.gray}>
          {label ?? ""}
        </text>
      </svg>
    </div>
  );
}

// ─── 1. SITUACIÓN PATRIMONIAL CHARTS ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PatrimonialCharts({ d }: { d: any }) {
  const ant = d.valores_periodo_anterior ?? {};
  const ac  = d.activo_corriente ?? {};
  const anc = d.activo_no_corriente ?? {};
  const acA = ant.activo_corriente ?? {};
  const ancA = ant.activo_no_corriente ?? {};
  const pc  = d.pasivo_corriente ?? {};
  const pnc = d.pasivo_no_corriente ?? {};

  const pA = d.periodo_actual   ?? "Actual";
  const pB = d.periodo_anterior ?? "Anterior";

  // Stacked bar: Activo corriente vs no corriente
  const activoData = [
    { periodo: pA, corriente: toNum(ac.total),  noCorriente: toNum(anc.total)  },
    { periodo: pB, corriente: toNum(acA.total), noCorriente: toNum(ancA.total) },
  ];

  // Pie: Composición del activo actual
  const pieActivoData = [
    { name: "Disponibilidades",    value: toNum(ac.disponibilidades)   },
    { name: "Créditos ventas",     value: toNum(ac.creditos_por_ventas)},
    { name: "Créditos impositivos",value: toNum(ac.creditos_impositivos)},
    { name: "Bienes de cambio",    value: toNum(ac.bienes_de_cambio)   },
    { name: "Bienes de uso",       value: toNum(anc.bienes_de_uso)     },
  ].filter(x => x.value > 0).map((x, _, arr) => {
    const total = arr.reduce((s, a) => s + a.value, 0);
    return { ...x, pct: total > 0 ? (x.value / total) * 100 : 0 };
  });

  // Horizontal bar: Pasivos por tipo
  const pasivoData = [
    { name: "Comerciales (C)",  value: toNum(pc.deudas_comerciales) },
    { name: "Bancarias (C)",    value: toNum(pc.deudas_bancarias)   },
    { name: "Impositivas (C)",  value: toNum(pc.deudas_impositivas) },
    { name: "Sociales (C)",     value: toNum(pc.deudas_sociales)    },
    { name: "Bancarias (NC)",   value: toNum(pnc.deudas_bancarias)  },
    { name: "Sociales (NC)",    value: toNum(pnc.deudas_sociales)   },
  ].filter(x => x.value > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KpiIndicator label="Patrimonio Neto" value={toNum(d.patrimonio_neto)} prev={toNum(ant.patrimonio_neto)} />
        <KpiIndicator label="Total Activo"    value={toNum(d.total_activo)}    prev={toNum(ant.total_activo)}    />
        <KpiIndicator label="Total Pasivo"    value={toNum(d.total_pasivo)}    prev={toNum(ant.total_pasivo)}    />
      </div>

      {/* Stacked bar */}
      <ChartCard>
        <ChartTitle>Composición del Activo — {pA} vs {pB}</ChartTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={activoData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: C.gray }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={70} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,122,28,0.06)" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="corriente"   name="Activo Corriente"    stackId="a" fill={C.green}     radius={[0,0,0,0]} />
            <Bar dataKey="noCorriente" name="Activo No Corriente" stackId="a" fill={C.darkGreen} radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Pie activo */}
        {pieActivoData.length > 0 && (
          <ChartCard>
            <ChartTitle>Composición del Activo</ChartTitle>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieActivoData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90} paddingAngle={3} animationBegin={0} animationDuration={800}>
                  {pieActivoData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Horizontal bar pasivos */}
        {pasivoData.length > 0 && (
          <ChartCard>
            <ChartTitle>Pasivo por tipo</ChartTitle>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pasivoData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,122,28,0.06)" }} />
                <Bar dataKey="value" name="Monto" radius={[0,6,6,0]}>
                  {pasivoData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? C.earth : C.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

// ─── 2. MARGEN BRUTO CHARTS ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MargenBrutoCharts({ d }: { d: any }) {
  const pA = d.periodo_actual   ?? "Actual";
  const pB = d.periodo_anterior ?? "Anterior";

  const ventasData = (d.ventas_por_cultivo ?? []).map((v: { cultivo: string; ventas_actual: unknown; ventas_anterior: unknown }) => ({
    cultivo:    v.cultivo,
    [pA]:       toNum(v.ventas_actual),
    [pB]:       toNum(v.ventas_anterior),
  }));

  const total = toNum(d.total_ventas_actual);
  const pieData = (d.ventas_por_cultivo ?? [])
    .filter((v: { ventas_actual: unknown }) => toNum(v.ventas_actual) > 0)
    .map((v: { cultivo: string; ventas_actual: unknown }) => ({
      name: v.cultivo, value: toNum(v.ventas_actual),
      pct: total > 0 ? (toNum(v.ventas_actual) / total) * 100 : 0,
    }));

  const margenPctA = toNum(d.margen_bruto_pct_actual);
  const margenPctB = toNum(d.margen_bruto_pct_anterior);
  const costoActual = toNum(d.costo_ventas?.costo_total_actual);

  // Margen por cultivo: proporcional al % de ventas
  const margenData = (d.ventas_por_cultivo ?? []).map((v: { cultivo: string; ventas_actual: unknown }) => {
    const venta = toNum(v.ventas_actual);
    const costoProp = total > 0 ? costoActual * (venta / total) : 0;
    return { cultivo: v.cultivo, margen: venta - costoProp };
  }).filter((x: { margen: number }) => x.margen !== 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KpiIndicator label="Total Ventas" value={toNum(d.total_ventas_actual)} prev={toNum(d.total_ventas_anterior)} />
        <KpiIndicator label="Resultado Bruto" value={toNum(d.resultado_bruto_actual)} prev={toNum(d.resultado_bruto_anterior)} />
        <KpiIndicator label="Margen Bruto %" value={margenPctA} prev={margenPctB} format="pct" />
      </div>

      {/* Grouped bar ventas */}
      {ventasData.length > 0 && (
        <ChartCard>
          <ChartTitle>Ventas por Cultivo — {pA} vs {pB}</ChartTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ventasData} barGap={4} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
              <XAxis dataKey="cultivo" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,122,28,0.06)" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey={pA} fill={C.green}     radius={[6,6,0,0]} />
              <Bar dataKey={pB} fill={C.mint}      radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Pie */}
        {pieData.length > 0 && (
          <ChartCard>
            <ChartTitle>Composición de Ventas</ChartTitle>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%"
                  innerRadius={55} outerRadius={88} paddingAngle={3} animationBegin={0} animationDuration={800}>
                  {pieData.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Margen bar */}
        {margenData.length > 0 && (
          <ChartCard>
            <ChartTitle>Margen Bruto por Cultivo</ChartTitle>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={margenData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
                <XAxis dataKey="cultivo" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,122,28,0.06)" }} />
                <Bar dataKey="margen" name="Margen" radius={[6,6,0,0]}>
                  {margenData.map((x: { margen: number }, i: number) => (
                    <Cell key={i} fill={x.margen >= 0 ? C.green : C.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

// ─── 3. RATIOS CHARTS ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RatiosCharts({ d }: { d: any }) {
  const ratios: { categoria: string; indicador: string; valor_actual: number; valor_anterior: number; unidad: string }[] = d.ratios ?? [];
  const pA = ratios[0] ? (d.periodo_actual ?? "Actual")   : "Actual";
  const pB = ratios[0] ? (d.periodo_anterior ?? "Anterior") : "Anterior";

  // Semáforo thresholds (agro)
  const thresholds: Record<string, { good: (v: number) => boolean; warn: (v: number) => boolean }> = {
    "ROE":                   { good: v => v > 10,   warn: v => v > 0    },
    "ROA":                   { good: v => v > 5,    warn: v => v > 0    },
    "Margen Bruto":          { good: v => v > 20,   warn: v => v > 10   },
    "Margen Neto":           { good: v => v > 10,   warn: v => v > 0    },
    "Liquidez Corriente":    { good: v => v > 1.5,  warn: v => v > 1    },
    "Liquidez Seca":         { good: v => v > 1,    warn: v => v > 0.5  },
    "Razón de Endeudamiento":{ good: v => v < 40,   warn: v => v < 60   },
    "Deuda sobre Patrimonio":{ good: v => v < 1,    warn: v => v < 2    },
    "Índice de Solvencia":   { good: v => v > 2,    warn: v => v > 1    },
    "Patrimonio sobre Activo":{ good: v => v > 50,  warn: v => v > 30   },
  };

  function semaforo(name: string, value: number): "green" | "yellow" | "red" {
    const key = Object.keys(thresholds).find(k => name.includes(k) || k.includes(name));
    if (!key) return "yellow";
    const t = thresholds[key];
    if (t.good(value)) return "green";
    if (t.warn(value)) return "yellow";
    return "red";
  }

  const semaforoColor = { green: C.green, yellow: C.gold, red: C.red };
  const semaforoLabel = { green: "Óptimo", yellow: "Regular", red: "Atención" };

  // Radar data — normalize to 0-100 for display
  const rentabilidad = ratios.filter(r => r.categoria === "Rentabilidad");
  const radarData = rentabilidad.map(r => ({
    indicador: r.indicador.replace(/\s/g, "\n"),
    [pA]: Math.max(0, Math.min(100, toNum(r.valor_actual))),
    [pB]: Math.max(0, Math.min(100, toNum(r.valor_anterior))),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Semáforos */}
      <ChartCard>
        <ChartTitle>Indicadores — Semáforo</ChartTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {ratios.map((r, i) => {
            const color = semaforoColor[semaforo(r.indicador, toNum(r.valor_actual))];
            const lbl   = semaforoLabel[semaforo(r.indicador, toNum(r.valor_actual))];
            const unit  = r.unidad === "pct" ? "%" : r.unidad === "veces" ? "x" : "";
            return (
              <div key={i} style={{
                padding: "14px 16px", borderRadius: 12, border: `2px solid ${color}`,
                backgroundColor: `${color}12`, display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.darkGreen, margin: 0, flex: 1 }}>{r.indicador}</p>
                  <span style={{
                    fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
                    color, background: `${color}20`, borderRadius: 99, padding: "2px 8px", flexShrink: 0,
                  }}>{lbl}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>
                  {fmtFull(toNum(r.valor_actual))}{unit}
                </p>
                <p style={{ fontSize: 10, color: C.gray, margin: 0 }}>
                  Anterior: {fmtFull(toNum(r.valor_anterior))}{unit}
                </p>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Radar — Rentabilidad */}
      {radarData.length >= 2 && (
        <ChartCard>
          <ChartTitle>Ratios de Rentabilidad — Radar</ChartTitle>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
              <PolarGrid stroke="#E8E5DE" />
              <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 11, fill: C.gray }} />
              <Radar name={pA} dataKey={pA} stroke={C.green}     fill={C.green}     fillOpacity={0.25} />
              <Radar name={pB} dataKey={pB} stroke={C.darkGreen} fill={C.darkGreen} fillOpacity={0.1}  />
              <Tooltip content={<CustomTooltip unit="%" />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Grouped bars all ratios */}
      <ChartCard>
        <ChartTitle>Comparativo Actual vs Anterior</ChartTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ratios.map(r => ({
            name: r.indicador, [pA]: toNum(r.valor_actual), [pB]: toNum(r.valor_anterior),
          }))} barGap={4} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.gray }} axisLine={false} tickLine={false}
              interval={0} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,122,28,0.06)" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey={pA} fill={C.green}  radius={[4,4,0,0]} />
            <Bar dataKey={pB} fill={C.mint}   radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── 4. BRIDGE CHARTS (Waterfall) ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BridgeCharts({ d }: { d: any }) {
  const items: { concepto: string; impacto: number }[] = d.items ?? [];
  const resultadoAnt = toNum(d.resultado_anterior);
  const resultadoAct = toNum(d.resultado_actual);

  // Build waterfall data: each bar has a hidden base + visible portion
  type WaterfallPoint = { name: string; base: number; value: number; fill: string; isTotal: boolean };
  const waterfallData: WaterfallPoint[] = [];

  waterfallData.push({
    name: d.periodo_anterior ?? "Anterior",
    base: 0, value: resultadoAnt,
    fill: C.gray, isTotal: true,
  });

  let running = resultadoAnt;
  for (const item of items) {
    const imp = toNum(item.impacto);
    const base = imp >= 0 ? running : running + imp;
    waterfallData.push({
      name: item.concepto.length > 20 ? item.concepto.slice(0, 18) + "…" : item.concepto,
      base, value: Math.abs(imp),
      fill: imp >= 0 ? C.green : C.red,
      isTotal: false,
    });
    running += imp;
  }

  waterfallData.push({
    name: d.periodo_actual ?? "Actual",
    base: 0, value: resultadoAct,
    fill: resultadoAct >= 0 ? C.darkGreen : C.red,
    isTotal: true,
  });

  const variacion = resultadoAct - resultadoAnt;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KpiIndicator label={`Resultado ${d.periodo_anterior ?? "Anterior"}`} value={resultadoAnt} />
        <KpiIndicator label={`Resultado ${d.periodo_actual ?? "Actual"}`}    value={resultadoAct} />
        <KpiIndicator label="Variación"                                       value={variacion}     />
      </div>

      {/* Waterfall */}
      <ChartCard>
        <ChartTitle>Bridge de Resultados — Cascada</ChartTitle>
        <p style={{ fontSize: 11, color: C.gray, marginBottom: 12 }}>
          <span style={{ color: C.green, fontWeight: 700 }}>■</span> Impacto positivo &nbsp;
          <span style={{ color: C.red,   fontWeight: 700 }}>■</span> Impacto negativo &nbsp;
          <span style={{ color: C.gray,  fontWeight: 700 }}>■</span> Totales
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={waterfallData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.gray }} axisLine={false} tickLine={false}
              angle={-30} textAnchor="end" height={54} interval={0} />
            <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={72} />
            <ReferenceLine y={0} stroke={C.gray} strokeDasharray="4 4" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const lbl = String(label ?? "");
                const row = waterfallData.find(r => r.name === lbl);
                const imp = items.find(it => it.concepto.startsWith(lbl.replace("…", "")));
                const rawVal = payload.find(p => p.dataKey === "value")?.value;
                const displayValue = row?.isTotal
                  ? toNum(rawVal as unknown)
                  : (imp ? toNum(imp.impacto) : null);
                return (
                  <div style={{
                    backgroundColor: C.darkGreen, color: "#fff", borderRadius: 10,
                    padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    minWidth: 160,
                  }}>
                    <p style={{ fontWeight: 700, color: C.mint, marginBottom: 6 }}>{lbl}</p>
                    <p style={{ fontWeight: 700 }}>{displayValue != null ? fmtARS(displayValue) : "—"}</p>
                  </div>
                );
              }}
              cursor={{ fill: "rgba(61,122,28,0.06)" }}
            />
            {/* Invisible base bar */}
            <Bar dataKey="base" stackId="a" fill="transparent" />
            {/* Visible value bar */}
            <Bar dataKey="value" stackId="a" radius={[4,4,0,0]}>
              {waterfallData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Items summary */}
      <ChartCard>
        <ChartTitle>Impacto de cada factor</ChartTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.map((item, i) => {
            const imp = toNum(item.impacto);
            const pct = resultadoAnt !== 0 ? (imp / Math.abs(resultadoAnt)) * 100 : 0;
            const barW = Math.min(100, Math.abs(pct));
            return (
              <div key={i} style={{
                padding: "10px 14px", backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#fff",
                borderBottom: "1px solid #F0EDE6", display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{item.concepto}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: imp >= 0 ? C.green : C.red }}>
                    {imp >= 0 ? "+" : ""}{fmtARS(imp)}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, backgroundColor: "#E8E5DE", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${barW}%`,
                    backgroundColor: imp >= 0 ? C.green : C.red,
                    borderRadius: 99, transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

// ─── 5. CALIFICACIÓN BANCARIA CHARTS ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CalificacionCharts({ d }: { d: any }) {
  const sp = d.situacion_patrimonial_resumen ?? {};
  const completitud = toNum(d.completitud_pct);

  const sections = [
    { label: "Datos generales",      key: "datos_generales"             },
    { label: "Campos propios",        key: "campos_propios"              },
    { label: "Agricultura",           key: "agricultura"                 },
    { label: "Maquinaria",            key: "maquinaria"                  },
    { label: "Ganadería",             key: "ganaderia"                   },
    { label: "Pasivos",               key: "pasivos"                     },
    { label: "Situación Patrimonial", key: "situacion_patrimonial_resumen"},
  ];

  const sectionData = sections.map(s => {
    const obj = d[s.key];
    if (!obj) return { label: s.label, pct: 0 };
    if (typeof obj === "object" && !Array.isArray(obj)) {
      const vals = Object.values(obj);
      const filled = vals.filter(v => v !== null && v !== undefined && v !== false && v !== 0).length;
      const total  = vals.length;
      return { label: s.label, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
    }
    if (Array.isArray(obj)) return { label: s.label, pct: obj.length > 0 ? 100 : 0 };
    return { label: s.label, pct: 0 };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Gauge + KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 14 }}>
        <ChartCard>
          <ChartTitle>Completitud del formulario</ChartTitle>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 8 }}>
            <Gauge value={completitud} label="completitud" />
            <p style={{ fontSize: 11, color: C.gray, textAlign: "center", marginTop: 6 }}>
              {completitud >= 70 ? "Formulario listo para presentar" : completitud >= 40 ? "Completitud parcial" : "Datos insuficientes"}
            </p>
          </div>
        </ChartCard>
        <KpiIndicator label="Total Activo"    value={toNum(sp.total_activo)}    />
        <KpiIndicator label="Patrimonio Neto" value={toNum(sp.patrimonio_neto)} />
      </div>

      {/* Section bars */}
      <ChartCard>
        <ChartTitle>Completitud por sección</ChartTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sectionData.map((s, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.pct >= 70 ? C.green : s.pct >= 40 ? C.gold : C.red }}>
                  {s.pct}%
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 99, backgroundColor: "#E8E5DE", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${s.pct}%`,
                  backgroundColor: s.pct >= 70 ? C.green : s.pct >= 40 ? C.gold : C.red,
                  borderRadius: 99, transition: "width 0.8s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Datos faltantes summary */}
      {(d.datos_faltantes ?? []).length > 0 && (
        <ChartCard>
          <ChartTitle>Datos pendientes de completar</ChartTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {d.datos_faltantes.slice(0, 8).map((f: Record<string, string>, i: number) => (
              <div key={i} style={{
                padding: "10px 14px", backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#fff",
                borderBottom: "1px solid #F0EDE6", display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{ color: C.earth, flexShrink: 0, fontSize: 14 }}>○</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.darkGreen }}>{f.seccion}: </span>
                  <span style={{ fontSize: 12, color: C.text }}>{f.dato}</span>
                  <span style={{ fontSize: 11, color: C.gray }}> — {f.documento_sugerido}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// ─── 6. EVOLUCIÓN HISTÓRICA CHARTS ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EvolucionHistoricaCharts({ d }: { d: any }) {
  const periodos: string[] = d.periodos ?? [];

  // Helper: extract series from evolucion_resultados
  function getSeries(name: string): (number | null)[] {
    const filas = d.evolucion_resultados?.filas ?? [];
    const row = filas.find((f: { concepto: string }) =>
      f.concepto.trim().toUpperCase().includes(name.toUpperCase())
    );
    return row ? (row.valores as (number | null)[]) : periodos.map(() => null);
  }

  function getPatrimonioSeries(name: string): (number | null)[] {
    const filas = d.evolucion_patrimonial?.filas ?? [];
    const row = filas.find((f: { concepto: string }) =>
      f.concepto.trim().toUpperCase().includes(name.toUpperCase())
    );
    return row ? (row.valores as (number | null)[]) : periodos.map(() => null);
  }

  function getRatioSeries(name: string): (number | null)[] {
    const filas = d.evolucion_ratios?.filas ?? [];
    const row = filas.find((f: { ratio: string }) =>
      f.ratio.trim().toUpperCase().includes(name.toUpperCase())
    );
    return row ? (row.valores as (number | null)[]) : periodos.map(() => null);
  }

  // Main lines data
  const lineData = periodos.map((p, i) => ({
    periodo: p,
    "Ventas Netas":   getSeries("VENTAS NETAS")[i] ?? getSeries("VENTAS")[i],
    "Resultado Neto": getSeries("RESULTADO NETO")[i],
    "Patrimonio Neto":getPatrimonioSeries("PATRIMONIO NETO")[i],
  }));

  // Result bar (positive/negative)
  const resultadoBar = periodos.map((p, i) => ({
    periodo: p,
    resultado: getSeries("RESULTADO NETO")[i] ?? 0,
  }));

  // Ratios lines
  const ratioLineData = periodos.map((p, i) => ({
    periodo: p,
    "Margen Bruto %": getRatioSeries("MARGEN BRUTO")[i],
    "Liquidez":       getRatioSeries("LIQUIDEZ")[i],
    "Endeudamiento %":getRatioSeries("ENDEUDAMIENTO")[i],
  }));

  // Stacked area: ventas por cultivo
  const cultivos = (d.ventas_por_cultivo_historico ?? []).map((r: { cultivo: string }) => r.cultivo);
  const areaData = periodos.map((p, i) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = { periodo: p };
    for (const cult of cultivos) {
      const series = d.ventas_por_cultivo_historico.find((r: { cultivo: string }) => r.cultivo === cult);
      row[cult] = series?.valores[i] ?? null;
    }
    return row;
  });

  // Gastos grouped bar
  const gastosData = periodos.map((p, i) => ({
    periodo: p,
    "Gastos de Producción":   getSeries("GASTOS DE PRODUCCIÓN")[i] ?? getSeries("PRODUCCION")[i] ?? getSeries("GASTOS PROD")[i],
    "Gastos de Administración": getSeries("GASTOS DE ADMINISTRACIÓN")[i] ?? getSeries("ADMINISTRACION")[i],
  }));

  const CULT_COLORS = [C.darkGreen, C.green, C.gold, C.earth, C.lightGreen, C.mint, "#5B8DD9", "#8E44AD"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Main Lines: Ventas, Resultado, PN */}
      <ChartCard>
        <ChartTitle>Evolución de Resultados y Patrimonio</ChartTitle>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: C.gray }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={72} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.green, strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <ReferenceLine y={0} stroke={C.gray} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="Ventas Netas"   stroke={C.green}     strokeWidth={3} dot={{ r: 5, fill: C.green }}     activeDot={{ r: 7 }} connectNulls />
            <Line type="monotone" dataKey="Resultado Neto" stroke={C.gold}      strokeWidth={3} dot={{ r: 5, fill: C.gold }}      activeDot={{ r: 7 }} connectNulls />
            <Line type="monotone" dataKey="Patrimonio Neto"stroke={C.darkGreen} strokeWidth={3} dot={{ r: 5, fill: C.darkGreen }} activeDot={{ r: 7 }} connectNulls strokeDasharray="6 3" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Resultado por año — colored bars */}
      <ChartCard>
        <ChartTitle>Resultado Neto por Año</ChartTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={resultadoBar} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: C.gray }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={72} />
            <ReferenceLine y={0} stroke={C.gray} strokeDasharray="4 4" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,122,28,0.06)" }} />
            <Bar dataKey="resultado" name="Resultado Neto" radius={[6,6,0,0]}>
              {resultadoBar.map((r, i) => (
                <Cell key={i} fill={(r.resultado ?? 0) >= 0 ? C.green : C.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Stacked areas: Ventas por cultivo */}
      {cultivos.length > 0 && (
        <ChartCard>
          <ChartTitle>Evolución de Ventas por Cultivo</ChartTitle>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={areaData}>
              <defs>
                {cultivos.map((c: string, i: number) => (
                  <linearGradient key={c} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CULT_COLORS[i % CULT_COLORS.length]} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={CULT_COLORS[i % CULT_COLORS.length]} stopOpacity={0.15} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
              <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: C.gray }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.green, strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              {cultivos.map((c: string, i: number) => (
                <Area key={c} type="monotone" dataKey={c} stackId="1"
                  stroke={CULT_COLORS[i % CULT_COLORS.length]}
                  fill={`url(#areaGrad${i})`}
                  strokeWidth={2} connectNulls />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Ratios lines */}
      <ChartCard>
        <ChartTitle>Evolución de Ratios Clave</ChartTitle>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={ratioLineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: C.gray }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<CustomTooltip unit="%" />} cursor={{ stroke: C.green, strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Line type="monotone" dataKey="Margen Bruto %" stroke={C.green}     strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
            <Line type="monotone" dataKey="Liquidez"       stroke={C.gold}      strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
            <Line type="monotone" dataKey="Endeudamiento %" stroke={C.earth}    strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Gastos grouped */}
      <ChartCard>
        <ChartTitle>Gastos de Producción vs Administración</ChartTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={gastosData} barGap={4} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: C.gray }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtARS} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={72} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,122,28,0.06)" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="Gastos de Producción"    fill={C.darkGreen} radius={[4,4,0,0]} />
            <Bar dataKey="Gastos de Administración" fill={C.earth}    radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── 7. BREAK-EVEN CHARTS ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BreakEvenCharts({ d }: { d: any }) {
  const cultivos: { cultivo: string; superficie_ha: unknown; costos_fijos_usd_ha: unknown; costos_variables_usd_ha: unknown; costo_total_usd_ha: unknown; precio_usd_tn: unknown; be_rinde_tn_ha: unknown; rinde_actual_tn_ha: unknown; margen_sobre_be_pct: unknown }[] = d.cultivos ?? [];

  const hasRealData = cultivos.some((c: Record<string, unknown>) =>
    toNum(c.costo_total_usd_ha) > 0 || toNum(c.be_rinde_tn_ha) > 0
  );

  if (!hasRealData) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#F4F2EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📊</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.darkGreen }}>Datos insuficientes para el análisis gráfico</p>
        <p style={{ fontSize: 13, color: C.gray, maxWidth: 420, lineHeight: 1.6 }}>
          Subí un <strong>plan de siembra</strong> con costos por cultivo (semilla, agroquímicos, labores, cosecha) y
          precios estimados de venta para ver el análisis completo del punto de equilibrio.
        </p>
      </div>
    );
  }

  // Crossover chart: Ingresos vs Costos vs BE for main cultivo
  const mainCult = cultivos.find(c => toNum(c.precio_usd_tn) > 0 && toNum(c.costo_total_usd_ha) > 0) ?? cultivos[0];
  const crossData = mainCult ? (() => {
    const precio = toNum(mainCult.precio_usd_tn);
    const costoTotal = toNum(mainCult.costo_total_usd_ha);
    const beRinde = precio > 0 ? costoTotal / precio : 0;
    const maxRinde = Math.max(toNum(mainCult.rinde_actual_tn_ha) * 1.4, beRinde * 1.5, 5);
    const points = 8;
    return Array.from({ length: points }, (_, i) => {
      const rinde = (maxRinde / (points - 1)) * i;
      return {
        "Rinde (tn/ha)": +rinde.toFixed(2),
        "Ingresos (USD/ha)": +(rinde * precio).toFixed(0),
        "Costos (USD/ha)":   +costoTotal.toFixed(0),
      };
    });
  })() : [];

  const beRinde = mainCult ? (
    toNum(mainCult.precio_usd_tn) > 0
      ? toNum(mainCult.costo_total_usd_ha) / toNum(mainCult.precio_usd_tn)
      : toNum(mainCult.be_rinde_tn_ha)
  ) : 0;

  // Heatmap of tabla_sensibilidad
  const tabla = (d.tabla_sensibilidad ?? []) as (string | number)[][];
  const headers = tabla[0] as string[] ?? [];
  const rows = tabla.slice(1) as (string | number)[][];

  const allValues = rows.flatMap(r => r.slice(1).map(v => toNum(v))).filter(v => v !== 0);
  const minVal = allValues.length ? Math.min(...allValues) : -100;
  const maxVal = allValues.length ? Math.max(...allValues) : 200;

  function heatColor(v: number): string {
    if (v < 0) {
      const intensity = Math.min(1, Math.abs(v) / Math.max(1, Math.abs(minVal)));
      const r = Math.round(192 + 60 * intensity);
      const g = Math.round(57 - 57 * intensity);
      const b = Math.round(43 - 43 * intensity);
      return `rgb(${r},${g},${b})`;
    }
    const intensity = Math.min(1, v / Math.max(1, maxVal));
    const r = Math.round(26 + (168 - 26) * (1 - intensity));
    const g = Math.round(51 + (213 - 51) * intensity);
    const b = Math.round(17 + 17 * intensity);
    return `rgb(${r},${g},${b})`;
  }

  // BE bar summary
  const beBar = cultivos
    .filter(c => toNum(c.be_rinde_tn_ha) > 0 || toNum(c.rinde_actual_tn_ha) > 0)
    .map(c => ({
      cultivo: c.cultivo,
      "Rinde actual": toNum(c.rinde_actual_tn_ha),
      "Break-even":   toNum(c.be_rinde_tn_ha),
      margen: toNum(c.margen_sobre_be_pct),
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KpiIndicator label="Completitud"    value={toNum(d.completitud_pct)} format="pct" />
        <KpiIndicator label="Sup. total (ha)" value={toNum(d.resumen?.superficie_total_ha)} />
        <KpiIndicator label="Margen s/BE"    value={toNum(d.resumen?.margen_sobre_be_pct)} format="pct" />
      </div>

      {/* Crossover line chart */}
      {crossData.length > 0 && (
        <ChartCard>
          <ChartTitle>Ingreso vs Costo — {mainCult?.cultivo} (break-even ≈ {beRinde.toFixed(2)} tn/ha)</ChartTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={crossData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
              <XAxis dataKey="Rinde (tn/ha)" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${fmtARS(v)}`} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.green, strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <ReferenceLine x={+beRinde.toFixed(2)} stroke={C.gold} strokeDasharray="6 3" label={{ value: "BE", position: "top", fontSize: 11, fill: C.gold }} />
              {mainCult && toNum(mainCult.rinde_actual_tn_ha) > 0 && (
                <ReferenceLine x={toNum(mainCult.rinde_actual_tn_ha)} stroke={C.green} strokeDasharray="6 3"
                  label={{ value: "Real", position: "top", fontSize: 11, fill: C.green }} />
              )}
              <Line type="monotone" dataKey="Ingresos (USD/ha)" stroke={C.green}     strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Costos (USD/ha)"   stroke={C.red}       strokeWidth={3} dot={false} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* BE summary bars */}
      {beBar.length > 0 && (
        <ChartCard>
          <ChartTitle>Rinde Actual vs Break-Even por Cultivo</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={beBar} barGap={4} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
              <XAxis dataKey="cultivo" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v} tn`} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,122,28,0.06)" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="Rinde actual" fill={C.green}  radius={[4,4,0,0]} />
              <Bar dataKey="Break-even"   fill={C.earth}  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Heatmap */}
      {rows.length > 0 && headers.length > 1 && (
        <ChartCard>
          <ChartTitle>Tabla de Sensibilidad — Margen neto USD/ha (Rinde × Precio)</ChartTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} style={{
                      padding: "8px 12px", fontWeight: 700, textAlign: "center",
                      backgroundColor: C.darkGreen, color: "#fff",
                      borderRadius: i === 0 ? "8px 0 0 0" : i === headers.length - 1 ? "0 8px 0 0" : undefined,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => {
                      const v = toNum(cell);
                      const isHeader = ci === 0;
                      return (
                        <td key={ci} style={{
                          padding: "8px 12px", textAlign: "center", fontWeight: isHeader ? 700 : 600,
                          backgroundColor: isHeader ? "#F9F8F4" : heatColor(v),
                          color: isHeader ? C.darkGreen : Math.abs(v) > (maxVal - minVal) * 0.3 ? "#fff" : "#111",
                          border: "1px solid rgba(255,255,255,0.3)",
                          transition: "background-color 0.2s",
                        }}>
                          {isHeader ? cell : v >= 0 ? `+${fmtARS(v)}` : fmtARS(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// ─── Chart placeholder ────────────────────────────────────────────────────────
function ChartPlaceholder({ message }: { message: string }) {
  return (
    <div style={{ padding: "32px 20px", textAlign: "center", backgroundColor: "#FAFAF8", borderRadius: 14, border: "1px dashed #D6D1C8" }}>
      <p style={{ fontSize: 13, color: C.gray }}>{message}</p>
    </div>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ReportCharts({ reportId, d }: { reportId: string; d: any }) {
  if (reportId === "situacion-patrimonial") return <PatrimonialCharts d={d} />;
  if (reportId === "margen-bruto")          return <MargenBrutoCharts d={d} />;
  if (reportId === "ratios")                return <RatiosCharts d={d} />;
  if (reportId === "bridge")                return <BridgeCharts d={d} />;
  if (reportId === "calificacion-bancaria") return <CalificacionCharts d={d} />;
  if (reportId === "evolucion-historica")   return <EvolucionHistoricaCharts d={d} />;
  if (reportId === "break-even")            return <BreakEvenCharts d={d} />;
  return <div style={{ padding: 40, textAlign: "center", color: C.gray }}>Sin gráficos disponibles para este reporte.</div>;
}

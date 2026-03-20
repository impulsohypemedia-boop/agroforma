// ─── Shared constants across the app ─────────────────────────────────────────

/**
 * Human-readable labels for each report type.
 * Keys use the URL slug format (kebab-case).
 */
export const REPORT_LABELS: Record<string, string> = {
  "situacion-patrimonial":     "Situación Patrimonial",
  "margen-bruto":              "Margen Bruto por Cultivo",
  "ratios":                    "Ratios e Indicadores",
  "bridge":                    "Bridge de Resultados",
  "break-even":                "Punto de Equilibrio",
  "calificacion-bancaria":     "Calificación Bancaria",
  "evolucion-historica":       "Evolución Histórica",
  "ebitda":                    "EBITDA Agro",
  "real-vs-presupuesto":       "Real vs Presupuestado",
  "resultado-unidad-negocio":  "Resultado por Unidad de Negocio",
  "dashboard-mensual":         "Dashboard Mensual",
  "seguimiento-campana":       "Seguimiento de Campaña",
};

/**
 * Brand color palette used across the UI.
 */
export const COLORS = {
  // Greens
  green:       "#3D7A1C",
  greenDark:   "#1A3311",
  greenHover:  "#2E5E14",
  greenLight:  "#6B9F52",
  greenBg:     "#EBF3E8",
  greenBorder: "#C8E6C0",

  // Gold / Earth
  gold:        "#D4AD3C",
  earth:       "#B8922A",
  goldBg:      "#FFF8E7",
  goldBorder:  "#F0E6C8",

  // Neutrals
  text:        "#1A1A1A",
  textMuted:   "#6B6560",
  textLight:   "#9B9488",
  textLighter: "#B0A99F",
  border:      "#E8E5DE",
  borderLight: "#D6D1C8",
  bgLight:     "#F0EDE6",
  bgPage:      "#F9F8F4",
  white:       "#FFFFFF",

  // Feedback
  errorRed:    "#C0392B",
  errorBg:     "#FEE9E9",
  errorBorder: "#FBCFCF",
  warnYellow:  "#FEF3CD",
  warnText:    "#8B7A3E",
} as const;

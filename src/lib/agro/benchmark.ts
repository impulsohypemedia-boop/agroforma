// Benchmark estático de márgenes/costos promedio por zona y cultivo.
// Fuente de referencia: promedios CREA/Bolsa de Cereales, campañas 2023-2025.
// Se actualizará periódicamente con datos reales.

export type BenchmarkEntry = {
  zona: string;
  cultivo: string;
  rendimientoPromedio: number;  // tn/ha
  precioReferencia: number;     // USD/tn
  costosDirectos: number;       // USD/ha
  margenBrutoHa: number;        // USD/ha
};

export type ZonaInfo = {
  zona: string;
  provincias: string[];         // provincias que cubre
};

// Zonas agrícolas definidas (agrupan provincias)
export const ZONAS: ZonaInfo[] = [
  { zona: "Núcleo Norte",   provincias: ["Santa Fe", "Córdoba"] },
  { zona: "Núcleo Sur",     provincias: ["Buenos Aires"] },
  { zona: "Sudeste BA",     provincias: ["Buenos Aires"] },
  { zona: "Sudoeste BA",    provincias: ["Buenos Aires", "La Pampa"] },
  { zona: "NEA",            provincias: ["Chaco", "Formosa", "Corrientes", "Misiones"] },
  { zona: "NOA",            provincias: ["Salta", "Tucumán", "Santiago del Estero", "Jujuy", "Catamarca"] },
  { zona: "Centro",         provincias: ["Entre Ríos", "Córdoba", "San Luis"] },
  { zona: "Cuyo",           provincias: ["Mendoza", "San Juan", "San Luis"] },
  { zona: "Pampeana",       provincias: ["La Pampa", "Buenos Aires", "Santa Fe", "Córdoba", "Entre Ríos"] },
];

// Dataset estático — promedios por zona y cultivo principal
const BENCHMARK_DATA: BenchmarkEntry[] = [
  // ─── Núcleo Norte ──────────────────────────────────────────
  { zona: "Núcleo Norte", cultivo: "Soja 1ra",  rendimientoPromedio: 3.8, precioReferencia: 310, costosDirectos: 480, margenBrutoHa: 698 },
  { zona: "Núcleo Norte", cultivo: "Soja 2da",  rendimientoPromedio: 2.8, precioReferencia: 310, costosDirectos: 380, margenBrutoHa: 488 },
  { zona: "Núcleo Norte", cultivo: "Maíz",      rendimientoPromedio: 9.5, precioReferencia: 180, costosDirectos: 650, margenBrutoHa: 1060 },
  { zona: "Núcleo Norte", cultivo: "Trigo",     rendimientoPromedio: 4.0, precioReferencia: 230, costosDirectos: 420, margenBrutoHa: 500 },
  { zona: "Núcleo Norte", cultivo: "Girasol",   rendimientoPromedio: 2.5, precioReferencia: 380, costosDirectos: 380, margenBrutoHa: 570 },
  { zona: "Núcleo Norte", cultivo: "Sorgo",     rendimientoPromedio: 6.0, precioReferencia: 150, costosDirectos: 350, margenBrutoHa: 550 },
  { zona: "Núcleo Norte", cultivo: "Cebada",    rendimientoPromedio: 4.2, precioReferencia: 210, costosDirectos: 400, margenBrutoHa: 482 },

  // ─── Núcleo Sur ────────────────────────────────────────────
  { zona: "Núcleo Sur", cultivo: "Soja 1ra",  rendimientoPromedio: 3.5, precioReferencia: 310, costosDirectos: 460, margenBrutoHa: 625 },
  { zona: "Núcleo Sur", cultivo: "Soja 2da",  rendimientoPromedio: 2.5, precioReferencia: 310, costosDirectos: 360, margenBrutoHa: 415 },
  { zona: "Núcleo Sur", cultivo: "Maíz",      rendimientoPromedio: 9.0, precioReferencia: 180, costosDirectos: 630, margenBrutoHa: 990 },
  { zona: "Núcleo Sur", cultivo: "Trigo",     rendimientoPromedio: 4.5, precioReferencia: 230, costosDirectos: 430, margenBrutoHa: 605 },
  { zona: "Núcleo Sur", cultivo: "Girasol",   rendimientoPromedio: 2.3, precioReferencia: 380, costosDirectos: 370, margenBrutoHa: 504 },
  { zona: "Núcleo Sur", cultivo: "Cebada",    rendimientoPromedio: 4.5, precioReferencia: 210, costosDirectos: 410, margenBrutoHa: 535 },

  // ─── Sudeste BA ────────────────────────────────────────────
  { zona: "Sudeste BA", cultivo: "Soja 1ra",  rendimientoPromedio: 3.0, precioReferencia: 310, costosDirectos: 430, margenBrutoHa: 500 },
  { zona: "Sudeste BA", cultivo: "Maíz",      rendimientoPromedio: 8.0, precioReferencia: 180, costosDirectos: 580, margenBrutoHa: 860 },
  { zona: "Sudeste BA", cultivo: "Trigo",     rendimientoPromedio: 4.8, precioReferencia: 230, costosDirectos: 440, margenBrutoHa: 664 },
  { zona: "Sudeste BA", cultivo: "Girasol",   rendimientoPromedio: 2.4, precioReferencia: 380, costosDirectos: 360, margenBrutoHa: 552 },
  { zona: "Sudeste BA", cultivo: "Cebada",    rendimientoPromedio: 4.8, precioReferencia: 210, costosDirectos: 420, margenBrutoHa: 588 },

  // ─── Sudoeste BA ───────────────────────────────────────────
  { zona: "Sudoeste BA", cultivo: "Soja 1ra",  rendimientoPromedio: 2.2, precioReferencia: 310, costosDirectos: 380, margenBrutoHa: 302 },
  { zona: "Sudoeste BA", cultivo: "Maíz",      rendimientoPromedio: 6.0, precioReferencia: 180, costosDirectos: 480, margenBrutoHa: 600 },
  { zona: "Sudoeste BA", cultivo: "Trigo",     rendimientoPromedio: 3.0, precioReferencia: 230, costosDirectos: 350, margenBrutoHa: 340 },
  { zona: "Sudoeste BA", cultivo: "Girasol",   rendimientoPromedio: 2.0, precioReferencia: 380, costosDirectos: 330, margenBrutoHa: 430 },

  // ─── NEA ───────────────────────────────────────────────────
  { zona: "NEA", cultivo: "Soja 1ra",  rendimientoPromedio: 2.5, precioReferencia: 310, costosDirectos: 400, margenBrutoHa: 375 },
  { zona: "NEA", cultivo: "Maíz",      rendimientoPromedio: 6.5, precioReferencia: 180, costosDirectos: 480, margenBrutoHa: 690 },
  { zona: "NEA", cultivo: "Sorgo",     rendimientoPromedio: 5.0, precioReferencia: 150, costosDirectos: 300, margenBrutoHa: 450 },
  { zona: "NEA", cultivo: "Algodón",   rendimientoPromedio: 2.0, precioReferencia: 500, costosDirectos: 550, margenBrutoHa: 450 },
  { zona: "NEA", cultivo: "Arroz",     rendimientoPromedio: 7.0, precioReferencia: 280, costosDirectos: 800, margenBrutoHa: 1160 },

  // ─── NOA ───────────────────────────────────────────────────
  { zona: "NOA", cultivo: "Soja 1ra",  rendimientoPromedio: 2.8, precioReferencia: 310, costosDirectos: 420, margenBrutoHa: 448 },
  { zona: "NOA", cultivo: "Maíz",      rendimientoPromedio: 7.0, precioReferencia: 180, costosDirectos: 520, margenBrutoHa: 740 },
  { zona: "NOA", cultivo: "Trigo",     rendimientoPromedio: 2.5, precioReferencia: 230, costosDirectos: 340, margenBrutoHa: 235 },
  { zona: "NOA", cultivo: "Poroto",    rendimientoPromedio: 1.8, precioReferencia: 600, costosDirectos: 450, margenBrutoHa: 630 },
  { zona: "NOA", cultivo: "Sorgo",     rendimientoPromedio: 5.5, precioReferencia: 150, costosDirectos: 320, margenBrutoHa: 505 },

  // ─── Centro ────────────────────────────────────────────────
  { zona: "Centro", cultivo: "Soja 1ra",  rendimientoPromedio: 3.2, precioReferencia: 310, costosDirectos: 450, margenBrutoHa: 542 },
  { zona: "Centro", cultivo: "Soja 2da",  rendimientoPromedio: 2.3, precioReferencia: 310, costosDirectos: 350, margenBrutoHa: 363 },
  { zona: "Centro", cultivo: "Maíz",      rendimientoPromedio: 8.0, precioReferencia: 180, costosDirectos: 580, margenBrutoHa: 860 },
  { zona: "Centro", cultivo: "Trigo",     rendimientoPromedio: 3.5, precioReferencia: 230, costosDirectos: 380, margenBrutoHa: 425 },
  { zona: "Centro", cultivo: "Sorgo",     rendimientoPromedio: 5.5, precioReferencia: 150, costosDirectos: 320, margenBrutoHa: 505 },

  // ─── Pampeana (promedio general) ───────────────────────────
  { zona: "Pampeana", cultivo: "Soja 1ra",  rendimientoPromedio: 3.3, precioReferencia: 310, costosDirectos: 450, margenBrutoHa: 573 },
  { zona: "Pampeana", cultivo: "Soja 2da",  rendimientoPromedio: 2.4, precioReferencia: 310, costosDirectos: 360, margenBrutoHa: 384 },
  { zona: "Pampeana", cultivo: "Maíz",      rendimientoPromedio: 8.5, precioReferencia: 180, costosDirectos: 600, margenBrutoHa: 930 },
  { zona: "Pampeana", cultivo: "Trigo",     rendimientoPromedio: 4.0, precioReferencia: 230, costosDirectos: 400, margenBrutoHa: 520 },
  { zona: "Pampeana", cultivo: "Girasol",   rendimientoPromedio: 2.3, precioReferencia: 380, costosDirectos: 360, margenBrutoHa: 514 },
  { zona: "Pampeana", cultivo: "Cebada",    rendimientoPromedio: 4.3, precioReferencia: 210, costosDirectos: 400, margenBrutoHa: 503 },
  { zona: "Pampeana", cultivo: "Sorgo",     rendimientoPromedio: 5.5, precioReferencia: 150, costosDirectos: 330, margenBrutoHa: 495 },
  { zona: "Pampeana", cultivo: "Maní",      rendimientoPromedio: 3.0, precioReferencia: 450, costosDirectos: 600, margenBrutoHa: 750 },
];

/**
 * Obtiene el benchmark para un cultivo en una provincia dada.
 * Busca primero en la zona más específica que incluya la provincia.
 * Si no encuentra, usa "Pampeana" como fallback general.
 */
export function getBenchmark(provincia: string, cultivo: string): BenchmarkEntry | null {
  // Normalizar cultivo (quitar acentos posibles, case-insensitive match)
  const norm = (s: string) => s.toLowerCase().trim();

  // Buscar zonas que incluyan la provincia, de más específica a menos
  const zonasMatch = ZONAS.filter(z => z.provincias.includes(provincia));

  for (const z of zonasMatch) {
    const entry = BENCHMARK_DATA.find(
      b => b.zona === z.zona && norm(b.cultivo) === norm(cultivo)
    );
    if (entry) return entry;
  }

  // Fallback: buscar en "Pampeana"
  const fallback = BENCHMARK_DATA.find(
    b => b.zona === "Pampeana" && norm(b.cultivo) === norm(cultivo)
  );
  return fallback ?? null;
}

/**
 * Obtiene todos los benchmarks disponibles para una provincia.
 */
export function getBenchmarksForProvincia(provincia: string): BenchmarkEntry[] {
  const zonasMatch = ZONAS.filter(z => z.provincias.includes(provincia));
  if (zonasMatch.length === 0) {
    return BENCHMARK_DATA.filter(b => b.zona === "Pampeana");
  }
  // Devolver todos los benchmarks de la primera zona específica
  const zona = zonasMatch[0].zona;
  return BENCHMARK_DATA.filter(b => b.zona === zona);
}

/**
 * Lista de todas las zonas disponibles.
 */
export function getZonas(): string[] {
  return [...new Set(BENCHMARK_DATA.map(b => b.zona))];
}

/**
 * Todos los benchmarks (para enviar a la API de análisis).
 */
export function getAllBenchmarks(): BenchmarkEntry[] {
  return BENCHMARK_DATA;
}

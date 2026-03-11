// ─── Gestión Agrícola ─────────────────────────────────────────────────────────

export type Campo = {
  id: string;
  nombre: string;
  provincia: string;
  hectareas: number;
  propietario?: string;
  coordenadas?: string;  // Raw string from plano — parsed on display
  notas?: string;
};

export type Lote = {
  id: string;
  campoId: string;
  cultivo: string;
  hectareas: number;
  rendimientoEsperado: number; // tn/ha
  precioEsperado: number;      // USD/tn
  costosDirectos: number;      // USD/ha
  campana: string;             // e.g. "2025/26"
  notas?: string;
};

// ─── Gestión Ganadera ─────────────────────────────────────────────────────────

export type CategoriaHacienda =
  | "Vacas"
  | "Vaquillonas"
  | "Novillos"
  | "Novillitos"
  | "Toros"
  | "Terneros/as"
  | "Bueyes"
  | "Otro";

export type StockPorCampo = {
  id: string;
  campoId: string;
  categoria: CategoriaHacienda;
  cantidad: number;
  pesoPromedio: number;  // kg
  raza?: string;
  boletoCamaraFecha?: string;
  boletoCamaraNro?: string;
};

export type TipoMovimiento = "Compra" | "Venta" | "Nacimiento" | "Muerte" | "Transferencia";

export type MovimientoHacienda = {
  id: string;
  fecha: string;         // ISO date string
  tipo: TipoMovimiento;
  campoId: string;
  categoria: CategoriaHacienda;
  cantidad: number;
  pesoTotal?: number;    // kg
  precioTotal?: number;  // ARS
  destino?: string;      // for transfers
  notas?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROVINCIAS_ARG = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export const CULTIVOS_LISTA = [
  "Soja 1ra",
  "Soja 2da",
  "Maíz",
  "Trigo",
  "Girasol",
  "Sorgo",
  "Cebada",
  "Algodón",
  "Maní",
  "Arroz",
  "Poroto",
  "Otros",
] as const;

export const CATEGORIAS_HACIENDA: CategoriaHacienda[] = [
  "Vacas",
  "Vaquillonas",
  "Novillos",
  "Novillitos",
  "Toros",
  "Terneros/as",
  "Bueyes",
  "Otro",
];

// ─── Mapa / Planos ────────────────────────────────────────────────────────────

export type LoteExtraido = {
  nombre: string;
  superficie_has: number;
  cultivo: string | null;
  ambiente: string | null;
};

export type AmbienteDetalle = {
  tipo: string;
  superficie_has: number;
  porcentaje: number;
};

export type CultivoDetectado = {
  cultivo: string;
  hectareas: number;
};

export type PlanoAnalizado = {
  campo: string | null;
  propietario: string | null;
  ubicacion: {
    localidad: string | null;
    provincia: string | null;
    coordenadas: string | null;
  };
  superficie_total: number | null;
  superficie_siembra: number | null;
  lotes: LoteExtraido[];
  ambientes: {
    descripcion: string | null;
    detalle: AmbienteDetalle[];
  };
  cultivos_detectados: CultivoDetectado[];
  infraestructura: string[];
  fuente: string | null;
  campaña: string | null;
};

export type ArchivoPlano = {
  id: string;
  nombre: string;
  tipo: "pdf" | "imagen" | "excel";
  tamano: number;       // bytes
  fechaSubida: string;  // ISO
  analizado: boolean;
  datos: PlanoAnalizado | null;
};

export const TIPOS_MOVIMIENTO: TipoMovimiento[] = [
  "Compra",
  "Venta",
  "Nacimiento",
  "Muerte",
  "Transferencia",
];

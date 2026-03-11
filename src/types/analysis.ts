// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractedDocData = {
  nombre_archivo: string;
  tipo: string;
  periodo: string;
  empresa: string;
  cuit?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datos: Record<string, any>;
};

export type DetectedDocument = {
  nombre_archivo: string;
  tipo: string;
  descripcion: string;
  periodo: string;
  datos_disponibles: string[];
};

export type ReportePosible = {
  id: string;
  nombre: string;
  descripcion: string;
  disponible: boolean;
  motivo: string;
  nota?: string;
};

export type AnalysisResult = {
  empresa: string;
  cuit: string;
  documentos_detectados: DetectedDocument[];
  reportes_posibles: ReportePosible[];
  // Modo histórico
  balances_detectados?: number;
  ejercicios?: string[];
  empresa_consistente?: boolean;
  modo?: "simple" | "historico";
};

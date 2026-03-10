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
};

export type AnalysisResult = {
  empresa: string;
  cuit: string;
  documentos_detectados: DetectedDocument[];
  reportes_posibles: ReportePosible[];
};

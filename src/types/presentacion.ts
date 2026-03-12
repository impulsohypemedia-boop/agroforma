export type PresentacionTipo = "pdf" | "pptx" | "ppt" | "docx" | "otro";

export type Presentacion = {
  id: string;
  nombre: string;
  tipo: PresentacionTipo;
  size: number;   // bytes
  fecha: string;  // ISO date
  analisis?: string;      // AI summary text
  analisisAt?: string;    // ISO date of analysis
};

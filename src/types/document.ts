export type DocType = "PDF" | "XLSX" | "XLS" | "CSV";

export type UploadedDoc = {
  id: string;
  name: string;
  type: DocType;
  size: number;        // bytes
  date: string;        // ISO date string
  status: "Cargado";
  storage_path?: string;  // Supabase Storage path
};

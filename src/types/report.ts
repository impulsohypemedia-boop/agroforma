export type GeneratedReport = {
  id: string;
  reportId: string;
  title: string;
  generatedAt: string;      // ISO date string
  downloadPath: string;     // endpoint para regenerar el Excel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;                // JSON devuelto por Claude
};

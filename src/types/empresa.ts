export type Empresa = {
  id: string;
  nombre: string;
  cuit?: string;
  actividad: "agricola" | "ganadera" | "mixta";
  provincia?: string;
  localidad?: string;
  campana: string;
  creadaEl: string;
};

export type EmpresaFormData = {
  nombre: string;
  cuit?: string;
  actividad: "agricola" | "ganadera" | "mixta";
  provincia?: string;
  localidad?: string;
  campana: string;
};

// ─── Base de conocimiento CREA ──────────────────────────────────────────────
// Metodología estándar de gestión empresarial agropecuaria argentina.
// Fuente: Área de Economía, Unidad I+D, Movimiento CREA.

// ─── Indicadores Patrimoniales CREA ─────────────────────────────────────────
export const INDICADORES_PATRIMONIALES = {
  liquidez: {
    grupo: "Liquidez",
    indicadores: [
      {
        id: "liquidez",
        nombre: "Liquidez",
        formula: "Activo Corriente / Pasivo Corriente",
        interpretacion: "Capacidad para pagar deudas de corto plazo",
        pregunta: "Tengo suficientes activos liquidos para pagar las deudas que vencen pronto?",
        valorRef: "> 1.2",
        alerta: "Si < 1.2 hay riesgo de iliquidez; Si >> 3 hay exceso de activos ociosos",
        semaforo: (v: number) => v >= 1.2 ? (v <= 3 ? "verde" : "amarillo") : "rojo",
      },
      {
        id: "prueba_acida",
        nombre: "Prueba Acida",
        formula: "(Activo Corriente - Bienes de Cambio) / Pasivo Corriente",
        interpretacion: "Capacidad inmediata de pago sin inventarios",
        pregunta: "Si vendo solo mis activos mas liquidos, puedo cubrir mis deudas de corto plazo?",
        valorRef: "> 1",
        alerta: "Si < 1 hay insuficiencia de liquidez inmediata",
        semaforo: (v: number) => v >= 1 ? "verde" : "rojo",
      },
      {
        id: "solvencia_general",
        nombre: "Solvencia General",
        formula: "Activo Total / Pasivo Total",
        interpretacion: "Capacidad de la empresa para responder a todas sus deudas con el total de sus activos",
        pregunta: "La empresa tiene suficiente respaldo patrimonial para cubrir sus deudas?",
        valorRef: ">= 2",
        alerta: "Si < 1 la empresa tiene mas deudas que activos (riesgo de insolvencia)",
        semaforo: (v: number) => v >= 2 ? "verde" : (v >= 1 ? "amarillo" : "rojo"),
      },
      {
        id: "capital_trabajo_neto",
        nombre: "Capital de Trabajo Neto",
        formula: "Activo Corriente - Pasivo Corriente",
        interpretacion: "Fondos disponibles para financiar operaciones corrientes",
        pregunta: "Me sobra dinero despues de cubrir mis deudas de corto plazo?",
        valorRef: "> 0",
        alerta: "Si < 0: Deuda corriente supera activos liquidos, alerta financiera",
        semaforo: (v: number) => v > 0 ? "verde" : "rojo",
      },
      {
        id: "capital_trabajo_relativo",
        nombre: "Capital de Trabajo Relativo",
        formula: "Capital de Trabajo Neto / Activo Total",
        interpretacion: "Proporcion de activos financiados con capital de trabajo",
        pregunta: "Que proporcion de mis activos estan financiados por recursos liquidos de corto plazo?",
        valorRef: "> 20%",
        alerta: "Si < 20%: Capital de trabajo muy bajo, riesgo operativo",
        semaforo: (v: number) => v >= 0.20 ? "verde" : (v >= 0.10 ? "amarillo" : "rojo"),
      },
    ],
  },
  endeudamiento: {
    grupo: "Endeudamiento",
    indicadores: [
      {
        id: "endeudamiento_activo",
        nombre: "Endeudamiento sobre Activo",
        formula: "Pasivo Total / Activo Total",
        interpretacion: "Proporcion de los activos que no es propia",
        pregunta: "Que parte de mis activos esta financiada con deuda?",
        valorRef: "0.2 - 0.5",
        alerta: "Alto: vulnerabilidad a tasas/precios; muy bajo: posible subapalancamiento",
        semaforo: (v: number) => (v >= 0.2 && v <= 0.5) ? "verde" : (v < 0.2 ? "amarillo" : "rojo"),
      },
      {
        id: "endeudamiento_pn",
        nombre: "Endeudamiento sobre Patrimonio Neto",
        formula: "Pasivo Total / Patrimonio Neto",
        interpretacion: "Nivel de dependencia de los acreedores",
        pregunta: "Cuantos pesos de deuda tengo por cada peso propio invertido?",
        valorRef: "< 100%",
        alerta: "Si > 100%: Capital propio insuficiente para respaldar la deuda",
        semaforo: (v: number) => v < 1 ? "verde" : "rojo",
      },
      {
        id: "calidad_deuda",
        nombre: "Calidad de Deuda",
        formula: "Pasivo Corriente / Pasivo Total",
        interpretacion: "Concentracion de vencimientos en el corto plazo",
        pregunta: "Que porcion de la deuda vence pronto?",
        valorRef: "<= 40-50%",
        alerta: "Alta: riesgo de roll-over; muy baja: estructura holgada pero quiza costosa",
        semaforo: (v: number) => v <= 0.5 ? "verde" : (v <= 0.7 ? "amarillo" : "rojo"),
      },
    ],
  },
  riesgo: {
    grupo: "Perfil de Riesgo",
    indicadores: [
      {
        id: "apalancamiento",
        nombre: "Apalancamiento Financiero",
        formula: "Activo Total / Patrimonio Neto",
        interpretacion: "Cuantas veces el patrimonio respalda los activos",
        pregunta: "Cuanto capital ajeno se usa por cada peso de capital propio?",
        valorRef: "1.5 a 2.5",
        alerta: "Si > 2: alta exposicion a shocks; Si = 1 no hay apalancamiento",
        semaforo: (v: number) => (v >= 1.5 && v <= 2.5) ? "verde" : (v > 2.5 ? "rojo" : "amarillo"),
      },
      {
        id: "autonomia_financiera",
        nombre: "Autonomia Financiera",
        formula: "Patrimonio Neto / Activo Total",
        interpretacion: "Dependencia de financiamiento propio",
        pregunta: "Que tan independiente es la empresa del financiamiento ajeno?",
        valorRef: "> 50%",
        alerta: "Si > 50%: solida. Si < 30%: fragil, depende mucho de deuda",
        semaforo: (v: number) => v > 0.50 ? "verde" : (v >= 0.30 ? "amarillo" : "rojo"),
      },
      {
        id: "inmovilizacion_activo",
        nombre: "Inmovilizacion de Activo",
        formula: "Activo No Corriente / Activo Total",
        interpretacion: "Grado de inversion en activos fijos",
        pregunta: "Que porcentaje de mis activos esta atado en activos fijos?",
        valorRef: "< 70%",
        alerta: "Si > 70%: Excesiva inmovilizacion, rigidez financiera",
        semaforo: (v: number) => v < 0.70 ? "verde" : (v < 0.85 ? "amarillo" : "rojo"),
      },
    ],
  },
  rentabilidad: {
    grupo: "Rentabilidad",
    indicadores: [
      {
        id: "roe",
        nombre: "ROE (Rentabilidad sobre Patrimonio Neto)",
        formula: "Resultado del Ejercicio / Patrimonio Neto Inicio",
        interpretacion: "Rentabilidad para los accionistas",
        pregunta: "Que retorno genero la empresa sobre el capital propio invertido?",
        valorRef: "> 15%",
        alerta: "Si < 15%: Rentabilidad insuficiente para el capital invertido",
        semaforo: (v: number) => v > 0.15 ? "verde" : (v > 0.05 ? "amarillo" : "rojo"),
      },
      {
        id: "variacion_patrimonial",
        nombre: "Variacion Patrimonial",
        formula: "(PN Cierre - PN Inicio) / PN Inicio",
        interpretacion: "Crecimiento o decrecimiento del patrimonio",
        pregunta: "Crecio mi capital propio durante el ejercicio?",
        valorRef: "> 0%",
        alerta: "Si negativo: Reduccion patrimonial, posible descapitalizacion",
        semaforo: (v: number) => v > 0 ? "verde" : (v === 0 ? "amarillo" : "rojo"),
      },
    ],
  },
} as const;

// Helper: obtener todos los indicadores como array plano
export function getAllIndicadores() {
  const all: Array<{
    id: string;
    grupo: string;
    nombre: string;
    formula: string;
    valorRef: string;
    semaforo: (v: number) => "verde" | "amarillo" | "rojo";
  }> = [];
  for (const [, cat] of Object.entries(INDICADORES_PATRIMONIALES)) {
    for (const ind of cat.indicadores) {
      all.push({ ...ind, grupo: cat.grupo });
    }
  }
  return all;
}

// ─── Cascada de Resultado por Produccion (RPP) ─────────────────────────────
export const CASCADA_RPP = [
  { id: 1, nombre: "Ingreso Neto", formula: null, descripcion: "Produccion Valorizada (Agricultura y Ganaderia) + Facturacion Neta (Lecheria y Servicios)" },
  { id: 2, nombre: "Gastos Directos Variables", formula: null, descripcion: "Gastos que generan variacion en la productividad" },
  { id: 3, nombre: "Contribucion Marginal", formula: "(1-2)", descripcion: null },
  { id: 4, nombre: "Gastos Directos Fijos", formula: null, descripcion: "Gastos que no generan variacion en la productividad" },
  { id: 5, nombre: "Margen Bruto", formula: "(3-4)", descripcion: null },
  { id: 6, nombre: "Amortizaciones Directas", formula: null, descripcion: "Amortizaciones asignables a una actividad" },
  { id: 7, nombre: "Impuestos y Tasas Directas", formula: null, descripcion: "Impuestos + tasas, provinciales y locales, asignables a una actividad" },
  { id: 8, nombre: "Tenencia de Bienes de Cambio Corrientes", formula: null, descripcion: "Stock Cierre + Ventas Brutas - Compras Brutas - Produccion Valorizada - Gastos Comerciales - Stock Inicio" },
  { id: 9, nombre: "Margen de Contribucion", formula: "(5-6-7+8)", descripcion: null },
  { id: 10, nombre: "Administracion Indirecta", formula: null, descripcion: null },
  { id: 11, nombre: "Impuestos Indirectos", formula: null, descripcion: "Impuestos + tasas no asignables a una actividad (IIBB)" },
  { id: 12, nombre: "Resultado Operativo (EBITDA)", formula: "(9-10-11+6)", descripcion: null },
  { id: 13, nombre: "Amortizaciones Indirectas", formula: null, descripcion: "Amortizaciones no asignables a una actividad" },
  { id: 14, nombre: "Resultado por Produccion", formula: "(12-6-13)", descripcion: null },
] as const;

// ─── Actividades para Margen de Contribucion ────────────────────────────────
export const ACTIVIDADES_CREA = [
  "Agricultura",
  "Ganaderia",
  "Lecheria",
  "Servicios",
  "Inmobiliario",
  "Gerenciamiento",
] as const;

// ─── Estructura del Margen Bruto Agricola ───────────────────────────────────
export const COSTOS_AGRICOLA = {
  ingresos: ["Ingreso Produccion Agricola", "Ingreso Indemnizacion Seguros"],
  gastos_variables: [
    "Cosecha Contratada", "Cosecha Propia",
    "Semillas", "Fertilizantes", "Herbicidas", "Insecticidas", "Fungicidas",
    "Otros Fitosanitarios", "Labores Contratadas", "Labores Propias", "Seguros",
  ],
  gastos_fijos: [
    "Personal", "Cargas Sociales", "Manutencion Personal",
    "Honorarios Profesionales", "Arrendamiento",
  ],
} as const;

// ─── Estructura del Margen Bruto Ganadero ───────────────────────────────────
export const ESTRUCTURA_GANADERA = {
  ingresos: [
    "Ingreso Kilos Producidos",
    "Ingreso Nacimientos - Destetes",
    "Ingreso Cambio Categoria",
    "Perdida Cambio Categoria",
    "Perdida Mortandad",
  ],
  metricas_productivas: [
    "Produccion Carne (Kg)",
    "Produccion Carne (Kg/ha)",
    "Carga (Kg/Ha)",
  ],
} as const;

// ─── Monedas soportadas ─────────────────────────────────────────────────────
export const MONEDAS_CREA = [
  { id: "pesos_corrientes", nombre: "Pesos Corrientes ($)", abrev: "$" },
  { id: "pesos_constantes", nombre: "Pesos Constantes ($)", abrev: "$ cte" },
  { id: "dolares_corrientes", nombre: "Dolares Corrientes (U$S)", abrev: "U$S" },
  { id: "dolares_constantes", nombre: "Dolares Constantes (U$S)", abrev: "U$S cte" },
] as const;

// ─── Estado de Situacion Patrimonial ────────────────────────────────────────
export const ESTRUCTURA_PATRIMONIAL = {
  activo_corriente: {
    nombre: "Activo Corriente",
    cuentas: [
      { nombre: "Disponibilidades", subcuentas: ["Caja - Bancos - Cheques ($)", "Caja - Bancos - Cheques (U$S)"], disponible: true },
      { nombre: "Inversiones", subcuentas: ["Fondos - Bonos - Acciones ($)", "Fondos - Bonos - Acciones (U$S)"], disponible: true },
      { nombre: "Creditos", subcuentas: ["Creditos Comerciales ($)", "Creditos Comerciales (U$S)", "Creditos Fiscales ($)", "Retiros a cuenta de dividendos ($)", "Retiros a cuenta de dividendos (U$S)", "Otros creditos ($)", "Otros creditos (U$S)"], disponible: false },
      { nombre: "Bienes de Cambio", subcuentas: ["Stock Productos Agricolas (U$S)", "Stock Insumos ($)", "Stock Insumos (U$S)", "Sementeras (U$S)", "Stock Hacienda (Invernada) ($)", "Otros ($)"], disponible: false },
    ],
  },
  activo_no_corriente: {
    nombre: "Activo No Corriente",
    cuentas: [
      { nombre: "Bienes de Cambio", subcuentas: ["Stock Hacienda (Cria y/o Tambo) ($)", "Otros ($)"], disponible: false },
      { nombre: "Bienes de Uso", subcuentas: ["Pasturas ($)", "Vehiculos ($)", "Maquinaria ($)", "Maquinaria (U$S)", "Instalaciones ($)", "Instalaciones (U$S)", "Tierra y Mejoras (U$S)"], disponible: false },
    ],
  },
  pasivo_corriente: {
    nombre: "Pasivo Corriente",
    cuentas: [
      { nombre: "Comerciales", subcuentas: ["No Bancarias ($)", "No Bancarias (U$S)"] },
      { nombre: "Financieros", subcuentas: ["Bancarios ($)", "Bancarios (U$S)"] },
      { nombre: "Otros", subcuentas: ["Fiscales ($)", "Sociales ($)", "Deudas a accionistas ($)", "Deudas a accionistas (U$S)", "Otro (U$S)", "Dividendos a pagar (U$S)"] },
    ],
  },
  pasivo_no_corriente: {
    nombre: "Pasivo No Corriente",
    cuentas: [
      { nombre: "Comerciales", subcuentas: ["No Bancarias ($)", "No Bancarias (U$S)"] },
      { nombre: "Financieros", subcuentas: ["Deudas ($)", "Deudas (U$S)"] },
      { nombre: "Otros", subcuentas: ["Otro (U$S)"] },
    ],
  },
} as const;

// ─── Valorizacion de Bienes de Cambio ───────────────────────────────────────
export const ESTRUCTURA_BIENES_CAMBIO = {
  productos: {
    nombre: "Productos (Granos)",
    filas: [
      "Stock al Inicio",
      "Produccion Valorizada",
      "Ventas Netas",
      "Cesiones Netas (Salidas)",
      "Stock al Cierre (Calculado)",
      "Tenencia Productos",
      "Stock Cierre (Ajuste Precio $ Corrientes)",
      "Exposicion Inflacion/Devaluacion",
      "Stock Cierre (Ajuste Precio $ Constantes | U$S)",
    ],
    detalle_ventas: ["Venta Bruta", "Fletes", "Acondicionamiento", "Comisiones - Sellados", "Otros Gastos de Venta"],
  },
  insumos: {
    nombre: "Insumos",
    filas: [
      "Stock al Inicio",
      "Compras Netas",
      "Cesiones Netas (Entradas)",
      "Consumo Valorizado",
      "Stock Cierre (Calculado)",
      "Tenencia Productos",
      "Stock Cierre (Ajuste Precio $ Corrientes)",
      "Exposicion Inflacion/Devaluacion",
      "Stock Cierre (Ajuste Precio $ Constantes | U$S)",
    ],
    detalle_compras: ["Compra Bruta", "Fletes", "Comisiones", "Otros Gastos de Compra"],
  },
} as const;

// ─── Prompt context for AI ──────────────────────────────────────────────────
export const CREA_SYSTEM_CONTEXT = `
Eres un asesor de gestion empresarial agropecuaria argentina, formado en la metodologia del Movimiento CREA.

METODOLOGIA CREA - NORMAS DE GESTION:

1. BALANCE DE GESTION PATRIMONIAL
El balance se presenta en 4 monedas: Pesos Corrientes, Pesos Constantes (ajustados por IPIM),
Dolares Corrientes (divisa venta) y Dolares Constantes (ajustados por IPIM en USD).
Se analiza el Estado de Situacion Patrimonial al inicio y cierre del ejercicio (julio a junio).
Se calcula el Cuadro de Origen y Aplicacion de Fondos.

2. INDICADORES PATRIMONIALES
- LIQUIDEZ: Liquidez (>1.2), Prueba Acida (>1), Solvencia General (>=2), Capital de Trabajo Neto (>0), Capital de Trabajo Relativo (>20%)
- ENDEUDAMIENTO: Endeudamiento sobre Activo (0.2-0.5), sobre Pat. Neto (<100%), Calidad de Deuda (<=50%)
- RIESGO: Apalancamiento (1.5-2.5), Autonomia Financiera (>50%), Inmovilizacion de Activo (<70%)
- RENTABILIDAD: ROE (>15%), Variacion Patrimonial (>0%)

3. RESULTADO POR PRODUCCION (RPP)
Cascada: Ingreso Neto - Gastos Variables = Contribucion Marginal - Gastos Fijos = Margen Bruto
- Amortizaciones - Impuestos + Tenencia BC = Margen de Contribucion - Administracion - Impuestos Ind
+ Amortizaciones = EBITDA - Amortizaciones = Resultado por Produccion.

4. MARGEN DE CONTRIBUCION POR ACTIVIDAD
Se desglosa por: Agricultura, Ganaderia, Lecheria, Servicios, Inmobiliario, Gerenciamiento.
Cada actividad aporta su Ingreso Neto, Gastos Variables, Contribucion Marginal, Gastos Fijos,
Margen Bruto, Amortizaciones, Impuestos y Margen de Contribucion.

5. MARGEN BRUTO AGRICOLA
Por cultivo: superficie, produccion, rendimiento, precio VNR.
Costos: cosecha, semillas, fertilizantes, herbicidas, insecticidas, fungicidas, labores, seguros.
Se expresa en total, $/ha y $/Tn.

6. PRODUCCION GANADERA
Produccion de carne (kg y kg/ha), carga animal.
Ingresos: kilos producidos, nacimientos/destetes, cambios de categoria, mortandad.
Gastos: sanidad, alimentacion, personal, honorarios.

7. VALORIZACION DE BIENES DE CAMBIO
Para productos (granos) e insumos: Stock Inicio + Produccion/Compras - Ventas/Consumos = Stock Cierre.
Se calcula Tenencia (ganancia/perdida por mantener stock) y Exposicion a Inflacion/Devaluacion.
Tabla de movimientos mes a mes con precio, IPIM y tipo de cambio.

8. CAMPAÑA AGROPECUARIA
Ejercicio: 1 de julio al 30 de junio del año siguiente.
Moneda de registro configurable ($ o U$S).

9. PLANTILLAS CREA ESTANDAR
Los archivos con formato CREA se identifican por:
- "Reporte-Estandar-Patrimonial": Balance en 4 monedas con hojas Inicio, Indicadores, $, u$s, $ Constantes, u$s Constantes
- "Reportes-Estandar-CREA-Campana": RPP, Margen Contribucion, hojas por actividad (Agricultura, Ganaderia, Lecheria, Servicios, Inmobiliario, Gerenciamiento), Administracion, Validaciones
- "Valorizacion-Bienes-de-Cambio": Productos e insumos con movimientos mes a mes, tenencia, exposicion
- "Asistente de produccion ganadero": Planilla de datos ganaderos con validaciones, SIPM, Dolar

Cuando detectes un archivo que coincida con estos formatos CREA (por nombre de hojas, estructura o encabezados),
etiquetalo como "formato CREA" y procesalo con las normas especificas de cada reporte.

Cuando analices datos de una empresa, siempre:
- Compara los indicadores contra los valores de referencia CREA
- Usa semaforos: VERDE (dentro de parametros), AMARILLO (atencion), ROJO (alerta)
- Explica en lenguaje simple que significa cada indicador
- Sugiere acciones concretas cuando un indicador esta fuera de rango
- Expresa resultados en las monedas que correspondan
- Contextualiza con datos del sector cuando sea relevante
`;

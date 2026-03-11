import ExcelJS from "exceljs";

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  darkGreen:  "FF1A3311",
  midGreen:   "FF3D7A1C",
  lightGreen: "FFE8F5E3",
  white:      "FFFFFFFF",
  rowAlt:     "FFFAFAF8",
  pending:    "FFFFF3CD",
  pendText:   "FF92680A",
  border:     "FFE8E5DE",
  gray:       "FF888888",
  hdrBg:      "FFF0EDE6",
  amber:      "FFDA8A00",
  red:        "FFC0392B",
};

function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}
function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = parseFloat(v.replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; }
  return 0;
}
function fmtN(v: unknown): string {
  return v === null || v === undefined ? "" : new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num(v));
}
function pendOrVal(v: unknown): string {
  return (v === null || v === undefined || v === "") ? "PENDIENTE" : String(v);
}

// ─── Sheet helpers ────────────────────────────────────────────────────────────
function mkSheet(wb: ExcelJS.Workbook, name: string, colWidths: number[], landscape = false) {
  const ws = wb.addWorksheet(name, { pageSetup: { orientation: landscape ? "landscape" : "portrait", fitToPage: true } });
  ws.columns = colWidths.map((w) => ({ width: w }));
  return ws;
}

function sheetTitle(ws: ExcelJS.Worksheet, title: string) {
  const cols = ws.columnCount || ws.columns.length;
  const endCol = String.fromCharCode(64 + Math.max(cols, 1));
  const r = ws.addRow([title]);
  r.height = 28;
  ws.mergeCells(`A${r.number}:${endCol}${r.number}`);
  const c = r.getCell(1);
  c.value = title;
  c.fill = fill(C.darkGreen);
  c.font = { bold: true, size: 12, color: { argb: C.white }, name: "Calibri" };
  c.alignment = { horizontal: "center", vertical: "middle" };
}

function sectionHdr(ws: ExcelJS.Worksheet, label: string) {
  const cols = ws.columnCount || ws.columns.length;
  const endCol = String.fromCharCode(64 + Math.max(cols, 1));
  const r = ws.addRow([label.toUpperCase()]);
  r.height = 18;
  ws.mergeCells(`A${r.number}:${endCol}${r.number}`);
  const c = r.getCell(1);
  c.value = label.toUpperCase();
  c.fill = fill(C.midGreen);
  c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
  c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
}

function tableHdr(ws: ExcelJS.Worksheet, headers: string[]) {
  const r = ws.addRow(headers);
  r.height = 18;
  headers.forEach((_, i) => {
    const c = r.getCell(i + 1);
    c.fill = fill(C.hdrBg);
    c.font = { bold: true, size: 10, name: "Calibri" };
    c.alignment = { horizontal: i === 0 ? "left" : "center", vertical: "middle" };
    c.border = { bottom: { style: "thin", color: { argb: C.border } } } as ExcelJS.Borders;
  });
}

function dataRow(ws: ExcelJS.Worksheet, values: unknown[], rowIdx: number) {
  const r = ws.addRow(values as (string | number | null)[]);
  r.height = 17;
  values.forEach((v, i) => {
    const c = r.getCell(i + 1);
    const isPend = v === "PENDIENTE";
    c.fill = fill(isPend ? C.pending : rowIdx % 2 === 0 ? C.rowAlt : C.white);
    c.font = { size: 10, name: "Calibri", italic: isPend, color: { argb: isPend ? C.pendText : "FF000000" } };
    c.alignment = { horizontal: i === 0 ? "left" : "center", vertical: "middle" };
  });
}

function labelVal(ws: ExcelJS.Worksheet, label: string, value: unknown, rowIdx = 0) {
  const isPend = value === null || value === undefined || value === "";
  const display = isPend ? "PENDIENTE" : String(value);
  const r = ws.addRow([label, display]);
  r.height = 17;
  r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
  r.getCell(1).fill = fill(rowIdx % 2 === 0 ? C.rowAlt : C.white);
  r.getCell(2).font = { size: 10, name: "Calibri", italic: isPend, color: { argb: isPend ? C.pendText : "FF000000" } };
  r.getCell(2).fill = fill(isPend ? C.pending : rowIdx % 2 === 0 ? C.rowAlt : C.white);
}

function spacer(ws: ExcelJS.Worksheet) { ws.addRow([]).height = 6; }

function footer(ws: ExcelJS.Worksheet) {
  spacer(ws);
  const cols = ws.columnCount || ws.columns.length;
  const endCol = String.fromCharCode(64 + Math.max(cols, 1));
  const r = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${r.number}:${endCol}${r.number}`);
  r.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  r.getCell(1).alignment = { horizontal: "right" };
}

// ─── Main export ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const pct = num(d.completitud_pct ?? 0);
  const pctArgb = pct >= 70 ? C.midGreen : pct >= 40 ? C.amber : C.red;

  // ── 0. PORTADA ─────────────────────────────────────────────────────────────
  const ws0 = mkSheet(wb, "Portada", [34, 36]);
  sheetTitle(ws0, "CALIFICACIÓN BANCARIA — FORMULARIO CREA");
  spacer(ws0);
  let ri = 0;
  labelVal(ws0, "Empresa:", d.empresa, ri++);
  labelVal(ws0, "CUIT:", d.cuit, ri++);
  labelVal(ws0, "Ejercicio:", d.ejercicio, ri++);
  labelVal(ws0, "Fecha de generación:", d.fecha_generacion, ri++);
  spacer(ws0);
  const pRow = ws0.addRow([`COMPLETITUD: ${pct}%`]);
  pRow.height = 24;
  ws0.mergeCells(`A${pRow.number}:B${pRow.number}`);
  pRow.getCell(1).fill = fill(pctArgb);
  pRow.getCell(1).font = { bold: true, size: 13, color: { argb: C.white }, name: "Calibri" };
  pRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  if (d.nota_general) {
    spacer(ws0);
    const nr = ws0.addRow([d.nota_general]);
    nr.height = 60;
    ws0.mergeCells(`A${nr.number}:B${nr.number}`);
    nr.getCell(1).font = { size: 10, name: "Calibri" };
    nr.getCell(1).alignment = { wrapText: true, vertical: "top" };
    nr.getCell(1).fill = fill(C.rowAlt);
  }
  footer(ws0);

  // ── 1. DATOS GENERALES ─────────────────────────────────────────────────────
  const ws1 = mkSheet(wb, "Datos Generales", [30, 40]);
  sheetTitle(ws1, "1. DATOS GENERALES");
  spacer(ws1);
  const dg = d.datos_generales ?? {};
  ri = 0;
  [
    ["Razón Social",        dg.razon_social],
    ["CUIT",                dg.cuit],
    ["Domicilio",           dg.domicilio],
    ["Localidad",           dg.localidad],
    ["Provincia",           dg.provincia],
    ["Actividad Principal", dg.actividad],
    ["Campaña Actual",      dg.campana_actual],
    ["Campaña Proyectada",  dg.campana_proyectada],
    ["Capital Social ($)",  dg.capital_social !== null && dg.capital_social !== undefined ? fmtN(dg.capital_social) : null],
  ].forEach(([l, v]) => labelVal(ws1, String(l), v, ri++));
  footer(ws1);

  // ── 2. CAMPOS ──────────────────────────────────────────────────────────────
  const ws2 = mkSheet(wb, "Campos", [26, 16, 12, 18, 14, 14, 14, 14, 14, 14], true);
  sheetTitle(ws2, "2. CAMPOS PROPIOS Y ARRENDADOS");
  spacer(ws2);

  const cpropios    = (d.campos_propios ?? []) as Record<string, unknown>[];
  const carrendados = (d.campos_arrendados ?? []) as Record<string, unknown>[];
  const camposHdr   = ["Nombre","Provincia","CP","Coordenadas","Sup.(ha)","Agríc.(ha)","G.Cría","G.Inv.","G.Tambo","G.Otros"];

  if (cpropios.length > 0) {
    sectionHdr(ws2, "Campos Propios");
    tableHdr(ws2, [...camposHdr, "Valor USD/ha"]);
    cpropios.forEach((c, i) =>
      dataRow(ws2, [
        pendOrVal(c.nombre), pendOrVal(c.provincia), pendOrVal(c.codigo_postal), pendOrVal(c.coordenadas),
        c.superficie_has ?? "PENDIENTE", c.aptitud_agricola_has ?? "PENDIENTE",
        c.aptitud_ganadera_cria_has ?? "PENDIENTE", c.aptitud_ganadera_invernada_has ?? "PENDIENTE",
        c.aptitud_ganadera_tambo_has ?? "PENDIENTE", c.aptitud_ganadera_otros_has ?? "PENDIENTE",
        c.valor_usd_ha ?? "PENDIENTE",
      ], i)
    );
    spacer(ws2);
  } else {
    sectionHdr(ws2, "Campos Propios");
    const nr = ws2.addRow(["No se detectó información de campos propios."]);
    ws2.mergeCells(`A${nr.number}:K${nr.number}`);
    nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" };
    nr.height = 26; spacer(ws2);
  }
  if (carrendados.length > 0) {
    sectionHdr(ws2, "Campos Arrendados");
    tableHdr(ws2, [...camposHdr, "Valor USD/ha", "Arriendo USD/ha"]);
    carrendados.forEach((c, i) =>
      dataRow(ws2, [
        pendOrVal(c.nombre), pendOrVal(c.provincia), pendOrVal(c.codigo_postal), pendOrVal(c.coordenadas),
        c.superficie_has ?? "PENDIENTE", c.aptitud_agricola_has ?? "PENDIENTE",
        c.aptitud_ganadera_cria_has ?? "PENDIENTE", c.aptitud_ganadera_invernada_has ?? "PENDIENTE",
        c.aptitud_ganadera_tambo_has ?? "PENDIENTE", c.aptitud_ganadera_otros_has ?? "PENDIENTE",
        c.valor_usd_ha ?? "PENDIENTE", c.valor_arriendo_usd_ha ?? "PENDIENTE",
      ], i)
    );
  }
  footer(ws2);

  // ── 3. AGRICULTURA ─────────────────────────────────────────────────────────
  const ws3 = mkSheet(wb, "Agricultura", [16, 13, 13, 13, 13, 13, 13, 14, 12, 10], true);
  sheetTitle(ws3, "3. AGRICULTURA — PLAN DE SIEMBRA Y VENTAS");
  spacer(ws3);

  const agri = d.agricultura ?? {};
  const planHdrs = ["Cultivo","Sup.Propia","Sup.Arren.","Sup.Aparcería","Rend.tn/ha","Precio U$S/tn","G.Implant.","G.Protecc.","G.Cosecha","Riego"];

  if (agri.ventas_por_cultivo?.length > 0) {
    sectionHdr(ws3, "Ventas por Cultivo (Balance)");
    tableHdr(ws3, ["Cultivo", "Monto Actual ($)", "Monto Anterior ($)"]);
    agri.ventas_por_cultivo.forEach((v: { cultivo: unknown; monto_actual: unknown; monto_anterior: unknown }, i: number) =>
      dataRow(ws3, [pendOrVal(v.cultivo), v.monto_actual !== null ? fmtN(v.monto_actual) : "PENDIENTE", v.monto_anterior !== null ? fmtN(v.monto_anterior) : "PENDIENTE"], i)
    );
    spacer(ws3);
  }

  if (agri.plan_siembra_actual?.length > 0) {
    sectionHdr(ws3, "Plan de Siembra — Campaña Actual");
    tableHdr(ws3, planHdrs);
    agri.plan_siembra_actual.forEach((p: Record<string, unknown>, i: number) =>
      dataRow(ws3, [
        pendOrVal(p.cultivo), p.sup_propia_has ?? "PENDIENTE", p.sup_arrendada_has ?? "PENDIENTE",
        p.sup_aparceria_has ?? "PENDIENTE", p.rendimiento_tn_ha ?? "PENDIENTE", p.precio_usd_tn ?? "PENDIENTE",
        p.gastos_implantacion_usd_ha ?? "PENDIENTE", p.gastos_proteccion_usd_ha ?? "PENDIENTE",
        p.gastos_cosecha_usd_ha ?? "PENDIENTE", p.riego === null ? "PENDIENTE" : p.riego ? "SÍ" : "NO",
      ], i)
    );
    spacer(ws3);
  }
  if (agri.plan_siembra_proyectado?.length > 0) {
    sectionHdr(ws3, "Plan de Siembra — Campaña Proyectada");
    tableHdr(ws3, planHdrs);
    agri.plan_siembra_proyectado.forEach((p: Record<string, unknown>, i: number) =>
      dataRow(ws3, [
        pendOrVal(p.cultivo), p.sup_propia_has ?? "PENDIENTE", p.sup_arrendada_has ?? "PENDIENTE",
        p.sup_aparceria_has ?? "PENDIENTE", p.rendimiento_tn_ha ?? "PENDIENTE", p.precio_usd_tn ?? "PENDIENTE",
        p.gastos_implantacion_usd_ha ?? "PENDIENTE", p.gastos_proteccion_usd_ha ?? "PENDIENTE",
        p.gastos_cosecha_usd_ha ?? "PENDIENTE", p.riego === null ? "PENDIENTE" : p.riego ? "SÍ" : "NO",
      ], i)
    );
    spacer(ws3);
  }

  sectionHdr(ws3, "Almacenaje");
  const alm = agri.almacenaje ?? {};
  ri = 0;
  [["Planta Propia (tn)", alm.planta_propia_tn], ["Acopiador (tn)", alm.acopiador_tn], ["Silo Bolsa (tn)", alm.silo_bolsa_tn]]
    .forEach(([l, v]) => labelVal(ws3, String(l), v !== null && v !== undefined ? fmtN(v) : null, ri++));
  spacer(ws3);

  sectionHdr(ws3, "Labores (% Propio / Contratado)");
  const lab = agri.labores ?? {};
  tableHdr(ws3, ["Labor", "Propio %", "Contratado %"]);
  [["Roturación", lab.roturacion_propia_pct, lab.roturacion_contratada_pct],
   ["Siembra",    lab.siembra_propia_pct,    lab.siembra_contratada_pct],
   ["Protección", lab.proteccion_propia_pct, lab.proteccion_contratada_pct],
   ["Cosecha",    lab.cosecha_propia_pct,    lab.cosecha_contratada_pct],
  ].forEach(([l, p, c], i) => dataRow(ws3, [String(l), p ?? "PENDIENTE", c ?? "PENDIENTE"], i));
  footer(ws3);

  // ── 4. MAQUINARIA ──────────────────────────────────────────────────────────
  const ws4 = mkSheet(wb, "Maquinaria", [22, 18, 20, 10, 16], true);
  sheetTitle(ws4, "4. MAQUINARIA Y BIENES DE USO");
  spacer(ws4);

  const maq = d.maquinaria ?? {};
  if (maq.bienes_de_uso_total !== null && maq.bienes_de_uso_total !== undefined) {
    labelVal(ws4, "Total Bienes de Uso ($):", fmtN(maq.bienes_de_uso_total), 0);
    spacer(ws4);
  }
  const maqSections: [string, Record<string, unknown>[]][] = [
    ["Tractores",      maq.tractores      ?? []],
    ["Sembradoras",    maq.sembradoras    ?? []],
    ["Pulverizadoras", maq.pulverizadoras ?? []],
    ["Cosechadoras",   maq.cosechadoras   ?? []],
    ["Otros",          maq.otros          ?? []],
  ];
  maqSections.forEach(([label, items]) => {
    sectionHdr(ws4, label);
    tableHdr(ws4, ["Tipo/Descripción", "Marca", "Modelo", "Año", "Valor USD"]);
    if (items.length > 0) {
      items.forEach((m, i) =>
        dataRow(ws4, [
          pendOrVal(m.tipo ?? label), m.marca ?? "PENDIENTE", m.modelo ?? "PENDIENTE",
          m.anio ?? "PENDIENTE", m.valor_usd ?? "PENDIENTE",
        ], i)
      );
    } else {
      const nr = ws4.addRow(["PENDIENTE — Subí un inventario de maquinaria"]);
      ws4.mergeCells(`A${nr.number}:E${nr.number}`);
      nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" };
      nr.height = 20;
    }
    spacer(ws4);
  });
  if (maq.nota) {
    const nr = ws4.addRow([maq.nota]);
    ws4.mergeCells(`A${nr.number}:E${nr.number}`);
    nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" };
    nr.getCell(1).alignment = { wrapText: true }; nr.height = 35;
  }
  footer(ws4);

  // ── 5. GANADERÍA ───────────────────────────────────────────────────────────
  const ws5 = mkSheet(wb, "Ganadería", [28, 14, 14, 14, 14]);
  sheetTitle(ws5, "5. GANADERÍA");
  spacer(ws5);

  const gan = d.ganaderia ?? {};

  function ganSection(label: string, obj: Record<string, unknown> | undefined, cats: [string, string][], showIndicadores = false) {
    sectionHdr(ws5, label);
    if (!obj?.disponible) {
      const nr = ws5.addRow(["No se detectó información de " + label.toLowerCase() + ". Subí registros ganaderos."]);
      ws5.mergeCells(`A${nr.number}:E${nr.number}`);
      nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" };
      nr.height = 24; spacer(ws5); return;
    }
    tableHdr(ws5, ["Categoría", "Propias", "Terceros", "Compras", "Ventas"]);
    cats.forEach(([label2, key], i) => {
      const cat = (obj[key] ?? {}) as Record<string, unknown>;
      dataRow(ws5, [label2, cat.propias ?? "PENDIENTE", cat.terceros ?? "PENDIENTE", cat.compras ?? "PENDIENTE", cat.ventas ?? "PENDIENTE"], i);
    });
    if (showIndicadores && obj.indicadores) {
      const ind = obj.indicadores as Record<string, unknown>;
      spacer(ws5);
      sectionHdr(ws5, `Indicadores — ${label}`);
      ri = 0;
      Object.entries(ind).forEach(([k, v]) => labelVal(ws5, k.replace(/_/g, " "), v, ri++));
    }
    spacer(ws5);
  }

  ganSection("Cría", gan.cria, [
    ["Vacas","vacas"],["Vacas c/Preñez","vacas_prenadas"],["Vaquillonas 2-3","vaquillonas_2_3"],
    ["Vaquillonas 1-2","vaquillonas_1_2"],["Terneros/as","terneros"],["Toros","toros"],
  ], true);
  ganSection("Recría", gan.recria, [
    ["Novillo 2-3","novillo_2_3"],["Novillo 1-2","novillo_1_2"],["Vaquillonas","vaquillonas"],
    ["Terneros","terneros"],["Toros","toros"],
  ]);
  ganSection("Invernada", gan.invernada, [
    ["Novillo 2-3","novillo_2_3"],["Novillo 1-2","novillo_1_2"],["Vaquillonas","vaquillonas"],
    ["Terneros","terneros"],["Toros","toros"],
  ], true);
  ganSection("Feed Lot", gan.feedlot, [
    ["Novillo 2-3","novillo_2_3"],["Novillo 1-2","novillo_1_2"],
  ]);

  // Tambo
  sectionHdr(ws5, "Tambo");
  if (!gan.tambo?.disponible) {
    const nr = ws5.addRow(["No se detectó información de tambo."]);
    ws5.mergeCells(`A${nr.number}:E${nr.number}`);
    nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" };
    nr.height = 24;
  } else {
    tableHdr(ws5, ["Categoría", "Propias", "Terceros", "", ""]);
    const tambo = gan.tambo as Record<string, unknown>;
    [["Vaca Ordeñe","vaca_ordene"],["Vaca Seca","vaca_seca"],["Vaquillona Servicio","vaquillona_servicio"],
     ["Vaquillona Recría","vaquillona_recria"],["Terneras","terneras"],["Toros","toros"]].forEach(([l, k], i) => {
      const cat = (tambo[k] ?? {}) as Record<string, unknown>;
      dataRow(ws5, [l, cat.propias ?? "PENDIENTE", cat.terceros ?? "PENDIENTE", "", ""], i);
    });
  }
  spacer(ws5);

  // Porcinos / Ovinos
  const porc = gan.porcinos ?? {};
  sectionHdr(ws5, "Porcinos");
  if (!porc.disponible) {
    const nr = ws5.addRow(["No se detectó información de porcinos."]);
    ws5.mergeCells(`A${nr.number}:E${nr.number}`);
    nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" }; nr.height = 22;
  } else {
    ri = 0;
    [["Cerdas",porc.cerdas],["Padrillos",porc.padrillos],["Recría 1",porc.recria_1],["Recría 2",porc.recria_2],["Capones",porc.capones]]
      .forEach(([l,v]) => labelVal(ws5, String(l), v, ri++));
  }
  spacer(ws5);

  const ovin = gan.ovinos ?? {};
  sectionHdr(ws5, "Ovinos");
  if (!ovin.disponible) {
    const nr = ws5.addRow(["No se detectó información de ovinos."]);
    ws5.mergeCells(`A${nr.number}:E${nr.number}`);
    nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" }; nr.height = 22;
  } else {
    ri = 0;
    [["Ovejas",ovin.ovejas],["Corderos",ovin.corderos],["Capones",ovin.capones],["Borregos",ovin.borregos],["Carneros",ovin.carneros]]
      .forEach(([l,v]) => labelVal(ws5, String(l), v, ri++));
  }
  spacer(ws5);

  // Recursos Forrajeros
  sectionHdr(ws5, "Recursos Forrajeros");
  const rf = gan.recursos_forrajeros ?? {};
  ri = 0;
  [
    ["Pasturas Implantadas (ha)",   rf.pasturas_implantadas_has],
    ["Pasturas en Producción (ha)", rf.pasturas_produccion_has],
    ["Pasturas Degradadas (ha)",    rf.pasturas_degradadas_has],
    ["Campo Natural Bueno (ha)",    rf.campo_natural_bueno_has],
    ["Campo Natural Regular (ha)",  rf.campo_natural_regular_has],
    ["Verdeo Invierno (ha)",        rf.verdeo_invierno_has],
    ["Verdeo Verano (ha)",          rf.verdeo_verano_has],
  ].forEach(([l, v]) => labelVal(ws5, String(l), v !== null && v !== undefined ? fmtN(v) : null, ri++));
  footer(ws5);

  // ── 6. GASTOS Y PASIVOS ────────────────────────────────────────────────────
  const ws6 = mkSheet(wb, "Gastos y Pasivos", [30, 18, 14, 18, 18], true);
  sheetTitle(ws6, "6. GASTOS INDIRECTOS Y PASIVOS");
  spacer(ws6);

  const gi = d.gastos_indirectos ?? {};
  sectionHdr(ws6, "Gastos Indirectos (U$S/Año)");
  ri = 0;
  [["Administración", gi.administracion_usd_anio],["Estructura", gi.estructura_usd_anio],
   ["Impuestos",      gi.impuestos_usd_anio],     ["Total",      gi.total_usd_anio],
  ].forEach(([l, v]) => labelVal(ws6, String(l), v !== null && v !== undefined ? fmtN(v) : null, ri++));
  spacer(ws6);

  const pas = d.pasivos ?? {};
  sectionHdr(ws6, "Pasivos por Entidad");
  tableHdr(ws6, ["Entidad", "Moneda", "Monto", "Plazo", ""]);
  if (pas.deudas?.length > 0) {
    pas.deudas.forEach((p: Record<string, unknown>, i: number) =>
      dataRow(ws6, [pendOrVal(p.entidad), pendOrVal(p.moneda), p.monto !== null ? fmtN(p.monto) : "PENDIENTE", pendOrVal(p.plazo), ""], i)
    );
    spacer(ws6);
    labelVal(ws6, "Total Pasivo ($):", pas.total_pasivo !== null && pas.total_pasivo !== undefined ? fmtN(pas.total_pasivo) : null, 0);
  } else {
    const nr = ws6.addRow(["No se detectaron deudas en los documentos."]);
    ws6.mergeCells(`A${nr.number}:E${nr.number}`);
    nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" }; nr.height = 22;
  }
  spacer(ws6);

  const sp = d.situacion_patrimonial_resumen ?? {};
  sectionHdr(ws6, "Situación Patrimonial — Resumen");
  ri = 0;
  [["Total Activo ($)", sp.total_activo],["Total Pasivo ($)", sp.total_pasivo],
   ["Patrimonio Neto ($)", sp.patrimonio_neto],["Resultado del Ejercicio ($)", sp.resultado_ejercicio],
  ].forEach(([l, v]) => labelVal(ws6, String(l), v !== null && v !== undefined ? fmtN(v) : null, ri++));
  footer(ws6);

  // ── 7. PARTICIPACIÓN ACCIONARIA ────────────────────────────────────────────
  const ws7 = mkSheet(wb, "Participación Accionaria", [36, 22, 18]);
  sheetTitle(ws7, "7. PARTICIPACIÓN ACCIONARIA");
  spacer(ws7);

  const pa = d.participacion_accionaria ?? {};
  if (pa.disponible && pa.socios?.length > 0) {
    tableHdr(ws7, ["Apellido y Nombre / Razón Social", "DNI / CUIT", "% Participación"]);
    pa.socios.forEach((s: Record<string, unknown>, i: number) =>
      dataRow(ws7, [pendOrVal(s.apellido_nombre), s.dni ?? "PENDIENTE", s.participacion_pct ?? "PENDIENTE"], i)
    );
  } else {
    const nr = ws7.addRow(["No se detectó información accionaria. Subí el estatuto o acta de constitución."]);
    ws7.mergeCells(`A${nr.number}:C${nr.number}`);
    nr.getCell(1).fill = fill(C.pending); nr.getCell(1).font = { italic: true, size: 10, color: { argb: C.pendText }, name: "Calibri" };
    nr.getCell(1).alignment = { wrapText: true }; nr.height = 40;
  }
  footer(ws7);

  // ── 8. DATOS FALTANTES ─────────────────────────────────────────────────────
  const ws8 = mkSheet(wb, "Datos Faltantes", [22, 34, 40], true);
  sheetTitle(ws8, "DATOS FALTANTES — PRIORIDAD DE COMPLETAMIENTO");
  spacer(ws8);

  const faltantes = (d.datos_faltantes ?? []) as Record<string, unknown>[];
  if (faltantes.length > 0) {
    tableHdr(ws8, ["Sección", "Dato faltante", "Documento sugerido"]);
    faltantes.forEach((f, i) => {
      const r = ws8.addRow([pendOrVal(f.seccion), pendOrVal(f.dato), pendOrVal(f.documento_sugerido)]);
      r.height = 22;
      r.eachCell((c) => {
        c.fill = fill(i % 2 === 0 ? C.pending : "FFFFF9E6");
        c.font = { size: 10, name: "Calibri" };
        c.alignment = { wrapText: true, vertical: "middle" };
      });
    });
  } else {
    const okR = ws8.addRow(["¡Formulario completo! No hay datos faltantes."]);
    ws8.mergeCells(`A${okR.number}:C${okR.number}`);
    okR.getCell(1).fill = fill(C.lightGreen);
    okR.getCell(1).font = { bold: true, size: 11, color: { argb: C.midGreen }, name: "Calibri" };
    okR.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    okR.height = 30;
  }
  footer(ws8);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

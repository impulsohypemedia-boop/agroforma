"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { UploadedDoc } from "@/types/document";
import { GeneratedReport } from "@/types/report";
import { AnalysisResult, ExtractedDocData } from "@/types/analysis";
import { Campo, Lote, StockPorCampo, MovimientoHacienda, ArchivoPlano } from "@/types/gestion";
import { Empresa, EmpresaFormData } from "@/types/empresa";
import { Presentacion } from "@/types/presentacion";

// ── Per-company localStorage key helper ────────────────────────────────────
function eKey(id: string, tipo: string) {
  return `agroforma_empresa_${id}_${tipo}`;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

// ── Load all data for a given empresa ID ───────────────────────────────────
function loadEmpresaData(id: string) {
  return {
    documents:            loadJSON<UploadedDoc[]>(eKey(id, "documents"), []),
    generatedReports:     loadJSON<GeneratedReport[]>(eKey(id, "reports"), []),
    escenarios:           loadJSON<GeneratedReport[]>(eKey(id, "escenarios"), []),
    analysisResult:       loadJSON<AnalysisResult | null>(eKey(id, "analysis"), null),
    extractedDocsData:    loadJSON<ExtractedDocData[]>(eKey(id, "extracted_docs"), []),
    campos:               loadJSON<Campo[]>(eKey(id, "campos"), []),
    planSiembra:          loadJSON<Lote[]>(eKey(id, "plan_siembra"), []),
    campanaActual:        localStorage.getItem(eKey(id, "campana")) ?? "2025/26",
    stockHacienda:        loadJSON<StockPorCampo[]>(eKey(id, "stock_hacienda"), []),
    movimientosHacienda:  loadJSON<MovimientoHacienda[]>(eKey(id, "movimientos_hacienda"), []),
    archivosPlanos:       loadJSON<ArchivoPlano[]>(eKey(id, "planos"), []),
    presentaciones:       loadJSON<Presentacion[]>(eKey(id, "presentaciones"), []),
  };
}

type AppCtx = {
  // Empresa management
  empresas:            Empresa[];
  empresaActivaId:     string | null;
  empresaActiva:       Empresa | null;
  crearEmpresa:        (data: EmpresaFormData) => Empresa;
  cambiarEmpresa:      (id: string) => void;
  editarEmpresa:       (id: string, data: Partial<Empresa>) => void;
  eliminarEmpresa:     (id: string) => void;
  // Per-empresa data
  fileStore:           File[];
  setFileStore:        React.Dispatch<React.SetStateAction<File[]>>;
  documents:           UploadedDoc[];
  setDocuments:        React.Dispatch<React.SetStateAction<UploadedDoc[]>>;
  generatedReports:    GeneratedReport[];
  setGeneratedReports: React.Dispatch<React.SetStateAction<GeneratedReport[]>>;
  escenarios:          GeneratedReport[];
  setEscenarios:       React.Dispatch<React.SetStateAction<GeneratedReport[]>>;
  analysisResult:      AnalysisResult | null;
  setAnalysisResult:   React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
  extractedDocsData:   ExtractedDocData[];
  setExtractedDocsData: React.Dispatch<React.SetStateAction<ExtractedDocData[]>>;
  campos:              Campo[];
  setCampos:           React.Dispatch<React.SetStateAction<Campo[]>>;
  planSiembra:         Lote[];
  setPlanSiembra:      React.Dispatch<React.SetStateAction<Lote[]>>;
  campanaActual:       string;
  setCampanaActual:    React.Dispatch<React.SetStateAction<string>>;
  stockHacienda:       StockPorCampo[];
  setStockHacienda:    React.Dispatch<React.SetStateAction<StockPorCampo[]>>;
  movimientosHacienda: MovimientoHacienda[];
  setMovimientosHacienda: React.Dispatch<React.SetStateAction<MovimientoHacienda[]>>;
  archivosPlanos:      ArchivoPlano[];
  setArchivosPlanos:   React.Dispatch<React.SetStateAction<ArchivoPlano[]>>;
  planoBlobMap:        Record<string, File>;
  setPlanoBlobMap:     React.Dispatch<React.SetStateAction<Record<string, File>>>;
  presentaciones:      Presentacion[];
  setPresentaciones:   React.Dispatch<React.SetStateAction<Presentacion[]>>;
  presentacionBlobMap: Record<string, File>;
  setPresentacionBlobMap: React.Dispatch<React.SetStateAction<Record<string, File>>>;
};

const AppContext = createContext<AppCtx>({
  empresas: [], empresaActivaId: null, empresaActiva: null,
  crearEmpresa: () => ({ id: "", nombre: "", actividad: "mixta", campana: "2025/26", creadaEl: "" }),
  cambiarEmpresa: () => {}, editarEmpresa: () => {}, eliminarEmpresa: () => {},
  fileStore: [], setFileStore: () => {},
  documents: [], setDocuments: () => {},
  generatedReports: [], setGeneratedReports: () => {},
  escenarios: [], setEscenarios: () => {},
  analysisResult: null, setAnalysisResult: () => {},
  extractedDocsData: [], setExtractedDocsData: () => {},
  campos: [], setCampos: () => {},
  planSiembra: [], setPlanSiembra: () => {},
  campanaActual: "2025/26", setCampanaActual: () => {},
  stockHacienda: [], setStockHacienda: () => {},
  movimientosHacienda: [], setMovimientosHacienda: () => {},
  archivosPlanos: [], setArchivosPlanos: () => {},
  planoBlobMap: {}, setPlanoBlobMap: () => {},
  presentaciones: [], setPresentaciones: () => {},
  presentacionBlobMap: {}, setPresentacionBlobMap: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Empresa state ────────────────────────────────────────────────────────
  const [empresas,        setEmpresas]        = useState<Empresa[]>([]);
  const [empresaActivaId, setEmpresaActivaId] = useState<string | null>(null);

  // ── Per-empresa data state ───────────────────────────────────────────────
  const [fileStore,            setFileStore]            = useState<File[]>([]);
  const [documents,            setDocuments]            = useState<UploadedDoc[]>([]);
  const [generatedReports,     setGeneratedReports]     = useState<GeneratedReport[]>([]);
  const [escenarios,           setEscenarios]           = useState<GeneratedReport[]>([]);
  const [analysisResult,       setAnalysisResult]       = useState<AnalysisResult | null>(null);
  const [extractedDocsData,    setExtractedDocsData]    = useState<ExtractedDocData[]>([]);
  const [campos,               setCampos]               = useState<Campo[]>([]);
  const [planSiembra,          setPlanSiembra]          = useState<Lote[]>([]);
  const [campanaActual,        setCampanaActual]        = useState<string>("2025/26");
  const [stockHacienda,        setStockHacienda]        = useState<StockPorCampo[]>([]);
  const [movimientosHacienda,  setMovimientosHacienda]  = useState<MovimientoHacienda[]>([]);
  const [archivosPlanos,       setArchivosPlanos]       = useState<ArchivoPlano[]>([]);
  const [planoBlobMap,         setPlanoBlobMap]         = useState<Record<string, File>>({});
  const [presentaciones,       setPresentaciones]       = useState<Presentacion[]>([]);
  const [presentacionBlobMap,  setPresentacionBlobMap]  = useState<Record<string, File>>({});

  const [hydrated, setHydrated] = useState(false);

  const empresaActiva = empresas.find(e => e.id === empresaActivaId) ?? null;

  // ── Apply loaded data to state ────────────────────────────────────────────
  const applyEmpresaData = useCallback((data: ReturnType<typeof loadEmpresaData>) => {
    setDocuments(data.documents);
    setGeneratedReports(data.generatedReports);
    setEscenarios(data.escenarios);
    setAnalysisResult(data.analysisResult);
    setExtractedDocsData(data.extractedDocsData);
    setCampos(data.campos);
    setPlanSiembra(data.planSiembra);
    setCampanaActual(data.campanaActual);
    setStockHacienda(data.stockHacienda);
    setMovimientosHacienda(data.movimientosHacienda);
    setArchivosPlanos(data.archivosPlanos);
    setPresentaciones(data.presentaciones);
    setFileStore([]);
    setPlanoBlobMap({});
    setPresentacionBlobMap({});
  }, []);

  // ── Initial load & migration ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedEmpresas = localStorage.getItem("agroforma_empresas");
      const savedActivaId = localStorage.getItem("agroforma_empresa_activa");

      if (savedEmpresas) {
        // Normal load
        const lista: Empresa[] = JSON.parse(savedEmpresas);
        setEmpresas(lista);
        const activeId = savedActivaId && lista.find(e => e.id === savedActivaId)
          ? savedActivaId
          : (lista[0]?.id ?? null);
        setEmpresaActivaId(activeId);
        if (activeId) applyEmpresaData(loadEmpresaData(activeId));
      } else {
        // Check for legacy data to migrate
        const legacyDocs = localStorage.getItem("agroforma_documents");
        if (legacyDocs && legacyDocs !== "[]") {
          // Migrate: create default empresa and move old data
          const defaultId = "default";
          const defaultEmpresa: Empresa = {
            id: defaultId, nombre: "Mi Empresa",
            actividad: "mixta", campana: "2025/26",
            creadaEl: new Date().toISOString(),
          };
          const legacyKeys: [string, string][] = [
            ["agroforma_documents", "documents"],
            ["agroforma_reports", "reports"],
            ["agroforma_analysis", "analysis"],
            ["agroforma_extracted_docs", "extracted_docs"],
            ["agroforma_campos", "campos"],
            ["agroforma_plan_siembra", "plan_siembra"],
            ["agroforma_stock_hacienda", "stock_hacienda"],
            ["agroforma_movimientos_hacienda", "movimientos_hacienda"],
            ["agroforma_planos", "planos"],
          ];
          for (const [oldKey, newTipo] of legacyKeys) {
            const val = localStorage.getItem(oldKey);
            if (val) {
              localStorage.setItem(eKey(defaultId, newTipo), val);
              localStorage.removeItem(oldKey);
            }
          }
          const campanaOld = localStorage.getItem("agroforma_campana");
          if (campanaOld) {
            localStorage.setItem(eKey(defaultId, "campana"), campanaOld);
            localStorage.removeItem("agroforma_campana");
          }
          // Try to get empresa name from analysis
          const analysisRaw = localStorage.getItem(eKey(defaultId, "analysis"));
          if (analysisRaw) {
            try {
              const analysis = JSON.parse(analysisRaw);
              if (analysis?.empresa) defaultEmpresa.nombre = analysis.empresa;
            } catch { /* ignore */ }
          }
          localStorage.setItem("agroforma_empresas", JSON.stringify([defaultEmpresa]));
          localStorage.setItem("agroforma_empresa_activa", defaultId);
          setEmpresas([defaultEmpresa]);
          setEmpresaActivaId(defaultId);
          applyEmpresaData(loadEmpresaData(defaultId));
        }
        // else: no data at all, show empty state (empresas = [], empresaActivaId = null)
      }
    } catch { /* localStorage unavailable */ }
    setHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reload data when empresa changes (after initial hydration) ────────────
  useEffect(() => {
    if (!hydrated || !empresaActivaId) return;
    applyEmpresaData(loadEmpresaData(empresaActivaId));
    localStorage.setItem("agroforma_empresa_activa", empresaActivaId);
  }, [empresaActivaId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist per-empresa data ──────────────────────────────────────────────
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "documents"), JSON.stringify(documents)); }, [documents, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "reports"), JSON.stringify(generatedReports)); }, [generatedReports, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "escenarios"), JSON.stringify(escenarios)); }, [escenarios, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "analysis"), JSON.stringify(analysisResult)); }, [analysisResult, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "extracted_docs"), JSON.stringify(extractedDocsData)); }, [extractedDocsData, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "campos"), JSON.stringify(campos)); }, [campos, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "plan_siembra"), JSON.stringify(planSiembra)); }, [planSiembra, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "campana"), campanaActual); }, [campanaActual, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "stock_hacienda"), JSON.stringify(stockHacienda)); }, [stockHacienda, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "movimientos_hacienda"), JSON.stringify(movimientosHacienda)); }, [movimientosHacienda, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "planos"), JSON.stringify(archivosPlanos)); }, [archivosPlanos, hydrated, empresaActivaId]);
  useEffect(() => { if (!hydrated || !empresaActivaId) return; localStorage.setItem(eKey(empresaActivaId, "presentaciones"), JSON.stringify(presentaciones)); }, [presentaciones, hydrated, empresaActivaId]);

  // ── Persist empresa list ──────────────────────────────────────────────────
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_empresas", JSON.stringify(empresas)); }, [empresas, hydrated]);

  // ── Empresa management actions ────────────────────────────────────────────
  const crearEmpresa = useCallback((data: EmpresaFormData): Empresa => {
    const nueva: Empresa = {
      id: `emp_${Date.now()}`,
      nombre: data.nombre,
      cuit: data.cuit,
      actividad: data.actividad,
      provincia: data.provincia,
      localidad: data.localidad,
      campana: data.campana,
      creadaEl: new Date().toISOString(),
    };
    setEmpresas(prev => [...prev, nueva]);
    setEmpresaActivaId(nueva.id);
    return nueva;
  }, []);

  const cambiarEmpresa = useCallback((id: string) => {
    setEmpresaActivaId(id);
  }, []);

  const editarEmpresa = useCallback((id: string, data: Partial<Empresa>) => {
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    if (id === empresaActivaId && data.campana) setCampanaActual(data.campana);
  }, [empresaActivaId]);

  const eliminarEmpresa = useCallback((id: string) => {
    // Remove all empresa data from localStorage
    const tipos = ["documents", "reports", "escenarios", "analysis", "extracted_docs", "campos", "plan_siembra", "campana", "stock_hacienda", "movimientos_hacienda", "planos", "conversations", "active_conv", "presentaciones"];
    tipos.forEach(t => localStorage.removeItem(eKey(id, t)));
    setEmpresas(prev => {
      const rest = prev.filter(e => e.id !== id);
      if (empresaActivaId === id) {
        const nextId = rest[0]?.id ?? null;
        setEmpresaActivaId(nextId);
        if (nextId) applyEmpresaData(loadEmpresaData(nextId));
        else {
          // Reset all data
          setDocuments([]); setGeneratedReports([]); setEscenarios([]); setAnalysisResult(null);
          setExtractedDocsData([]); setCampos([]); setPlanSiembra([]);
          setCampanaActual("2025/26"); setStockHacienda([]); setMovimientosHacienda([]);
          setArchivosPlanos([]); setFileStore([]); setPlanoBlobMap({});
          setPresentaciones([]); setPresentacionBlobMap({});
        }
      }
      return rest;
    });
  }, [empresaActivaId, applyEmpresaData]);

  return (
    <AppContext.Provider value={{
      empresas, empresaActivaId, empresaActiva,
      crearEmpresa, cambiarEmpresa, editarEmpresa, eliminarEmpresa,
      fileStore, setFileStore,
      documents, setDocuments,
      generatedReports, setGeneratedReports,
      escenarios, setEscenarios,
      analysisResult, setAnalysisResult,
      extractedDocsData, setExtractedDocsData,
      campos, setCampos,
      planSiembra, setPlanSiembra,
      campanaActual, setCampanaActual,
      stockHacienda, setStockHacienda,
      movimientosHacienda, setMovimientosHacienda,
      archivosPlanos, setArchivosPlanos,
      planoBlobMap, setPlanoBlobMap,
      presentaciones, setPresentaciones,
      presentacionBlobMap, setPresentacionBlobMap,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);

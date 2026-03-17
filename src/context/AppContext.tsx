"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { UploadedDoc } from "@/types/document";
import { GeneratedReport } from "@/types/report";
import { AnalysisResult, ExtractedDocData } from "@/types/analysis";
import { Campo, Lote, StockPorCampo, MovimientoHacienda, ArchivoPlano } from "@/types/gestion";
import { Empresa, EmpresaFormData } from "@/types/empresa";
import { Presentacion } from "@/types/presentacion";
import { useAuth } from "@/context/AuthContext";
import {
  fetchEmpresas, createEmpresa as dbCreateEmpresa,
  updateEmpresa as dbUpdateEmpresa, deleteEmpresa as dbDeleteEmpresa,
  saveState, loadAllState,
} from "@/lib/supabase/db";

// ── Types ─────────────────────────────────────────────────────────────────────
type AppCtx = {
  loadingEmpresas:     boolean;
  loadingData:         boolean;
  empresas:            Empresa[];
  empresaActivaId:     string | null;
  empresaActiva:       Empresa | null;
  crearEmpresa:        (data: EmpresaFormData) => Promise<Empresa | null>;
  cambiarEmpresa:      (id: string) => void;
  editarEmpresa:       (id: string, data: Partial<Empresa>) => void;
  eliminarEmpresa:     (id: string) => void;
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
  loadingEmpresas: true, loadingData: false,
  empresas: [], empresaActivaId: null, empresaActiva: null,
  crearEmpresa: async () => null,
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

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [loadingData,     setLoadingData]     = useState(false);
  const [empresas,        setEmpresas]        = useState<Empresa[]>([]);
  const [empresaActivaId, setEmpresaActivaId] = useState<string | null>(null);

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

  // Gate that prevents saving back immediately after loading from DB
  const readyToSave = useRef(false);
  // When true, skip loadAllState and instead flush current in-memory state to the new empresa
  const skipNextLoad = useRef(false);

  const empresaActiva = empresas.find(e => e.id === empresaActivaId) ?? null;

  // ── Reset all per-empresa state to empty ─────────────────────────────────
  const resetData = useCallback(() => {
    setDocuments([]); setGeneratedReports([]); setEscenarios([]);
    setAnalysisResult(null); setExtractedDocsData([]);
    setCampos([]); setPlanSiembra([]); setCampanaActual("2025/26");
    setStockHacienda([]); setMovimientosHacienda([]);
    setArchivosPlanos([]); setFileStore([]); setPlanoBlobMap({});
    setPresentaciones([]); setPresentacionBlobMap({});
  }, []);

  // ── Apply a loaded state record to React state ───────────────────────────
  const applyState = useCallback((s: Record<string, unknown>) => {
    setDocuments(           (s.documents            as UploadedDoc[]        | null) ?? []);
    setGeneratedReports(    (s.reports               as GeneratedReport[]    | null) ?? []);
    setEscenarios(          (s.escenarios            as GeneratedReport[]    | null) ?? []);
    setAnalysisResult(      (s.analysis              as AnalysisResult       | null) ?? null);
    setExtractedDocsData(   (s.extracted_docs        as ExtractedDocData[]   | null) ?? []);
    setCampos(              (s.campos                as Campo[]              | null) ?? []);
    setPlanSiembra(         (s.plan_siembra          as Lote[]               | null) ?? []);
    setCampanaActual(       (s.campana               as string               | null) ?? "2025/26");
    setStockHacienda(       (s.stock_hacienda        as StockPorCampo[]      | null) ?? []);
    setMovimientosHacienda( (s.movimientos_hacienda  as MovimientoHacienda[] | null) ?? []);
    setArchivosPlanos(      (s.planos                as ArchivoPlano[]       | null) ?? []);
    setPresentaciones(      (s.presentaciones        as Presentacion[]       | null) ?? []);
    setFileStore([]); setPlanoBlobMap({}); setPresentacionBlobMap({});
  }, []);

  // ── Load empresas when user signs in ─────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setEmpresas([]);
      setEmpresaActivaId(null);
      setLoadingEmpresas(false);
      readyToSave.current = false;
      return;
    }
    readyToSave.current = false;
    setLoadingEmpresas(true);
    fetchEmpresas(user.id).then((lista) => {
      setEmpresas(lista);
      // Restore last active empresa from localStorage (cheap local pref)
      const savedId = typeof window !== "undefined"
        ? localStorage.getItem(`agroforma_activa_${user.id}`)
        : null;
      const activeId = savedId && lista.find(e => e.id === savedId)
        ? savedId
        : (lista[0]?.id ?? null);
      setEmpresaActivaId(activeId);
      setLoadingEmpresas(false);
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load per-empresa data when active empresa changes ────────────────────
  useEffect(() => {
    readyToSave.current = false;
    if (!empresaActivaId) { resetData(); return; }

    // Persist preference locally
    if (user?.id) {
      localStorage.setItem(`agroforma_activa_${user.id}`, empresaActivaId);
    }

    if (skipNextLoad.current) {
      // Just created empresa — keep current in-memory state and save it to the new empresa
      skipNextLoad.current = false;
      const eId = empresaActivaId;
      saveState(eId, "documents", documents);
      saveState(eId, "reports", generatedReports);
      saveState(eId, "escenarios", escenarios);
      saveState(eId, "analysis", analysisResult);
      saveState(eId, "extracted_docs", extractedDocsData);
      saveState(eId, "campos", campos);
      saveState(eId, "plan_siembra", planSiembra);
      saveState(eId, "campana", campanaActual);
      saveState(eId, "stock_hacienda", stockHacienda);
      saveState(eId, "movimientos_hacienda", movimientosHacienda);
      saveState(eId, "planos", archivosPlanos);
      saveState(eId, "presentaciones", presentaciones);
      readyToSave.current = true;
      return;
    }

    setLoadingData(true);
    loadAllState(empresaActivaId).then((state) => {
      applyState(state);
      setLoadingData(false);
      readyToSave.current = true;
    });
  }, [empresaActivaId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist per-empresa data to Supabase ─────────────────────────────────
  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "documents", documents);
  }, [documents]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "reports", generatedReports);
  }, [generatedReports]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "escenarios", escenarios);
  }, [escenarios]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "analysis", analysisResult);
  }, [analysisResult]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "extracted_docs", extractedDocsData);
  }, [extractedDocsData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "campos", campos);
  }, [campos]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "plan_siembra", planSiembra);
  }, [planSiembra]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "campana", campanaActual);
  }, [campanaActual]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "stock_hacienda", stockHacienda);
  }, [stockHacienda]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "movimientos_hacienda", movimientosHacienda);
  }, [movimientosHacienda]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "planos", archivosPlanos);
  }, [archivosPlanos]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyToSave.current || !empresaActivaId) return;
    saveState(empresaActivaId, "presentaciones", presentaciones);
  }, [presentaciones]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Empresa management actions ────────────────────────────────────────────
  const crearEmpresa = useCallback(async (data: EmpresaFormData): Promise<Empresa | null> => {
    if (!user) return null;
    const nueva = await dbCreateEmpresa(user.id, data);
    if (!nueva) return null;
    setEmpresas(prev => [...prev, nueva]);
    // Preserve current in-memory state (documents, analysis, etc.) when switching to the new empresa
    skipNextLoad.current = true;
    setEmpresaActivaId(nueva.id);
    return nueva;
  }, [user]);

  const cambiarEmpresa = useCallback((id: string) => {
    setEmpresaActivaId(id);
  }, []);

  const editarEmpresa = useCallback((id: string, data: Partial<Empresa>) => {
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    if (id === empresaActivaId && data.campana) setCampanaActual(data.campana);
    dbUpdateEmpresa(id, data);
  }, [empresaActivaId]);

  const eliminarEmpresa = useCallback((id: string) => {
    dbDeleteEmpresa(id);
    setEmpresas(prev => {
      const rest = prev.filter(e => e.id !== id);
      if (empresaActivaId === id) {
        const nextId = rest[0]?.id ?? null;
        setEmpresaActivaId(nextId);
        if (!nextId) resetData();
      }
      return rest;
    });
  }, [empresaActivaId, resetData]);

  return (
    <AppContext.Provider value={{
      loadingEmpresas, loadingData,
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

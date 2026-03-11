"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UploadedDoc } from "@/types/document";
import { GeneratedReport } from "@/types/report";
import { AnalysisResult } from "@/types/analysis";
import { Campo, Lote, StockPorCampo, MovimientoHacienda, ArchivoPlano } from "@/types/gestion";

type AppCtx = {
  fileStore:           File[];
  setFileStore:        React.Dispatch<React.SetStateAction<File[]>>;
  documents:           UploadedDoc[];
  setDocuments:        React.Dispatch<React.SetStateAction<UploadedDoc[]>>;
  generatedReports:    GeneratedReport[];
  setGeneratedReports: React.Dispatch<React.SetStateAction<GeneratedReport[]>>;
  analysisResult:      AnalysisResult | null;
  setAnalysisResult:   React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
  // Gestión
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
  archivosPlanos: ArchivoPlano[];
  setArchivosPlanos: React.Dispatch<React.SetStateAction<ArchivoPlano[]>>;
  // File blobs (not persisted to localStorage — only metadata is)
  planoBlobMap: Record<string, File>;
  setPlanoBlobMap: React.Dispatch<React.SetStateAction<Record<string, File>>>;
};

const AppContext = createContext<AppCtx>({
  fileStore:              [],
  setFileStore:           () => {},
  documents:              [],
  setDocuments:           () => {},
  generatedReports:       [],
  setGeneratedReports:    () => {},
  analysisResult:         null,
  setAnalysisResult:      () => {},
  campos:                 [],
  setCampos:              () => {},
  planSiembra:            [],
  setPlanSiembra:         () => {},
  campanaActual:          "2025/26",
  setCampanaActual:       () => {},
  stockHacienda:          [],
  setStockHacienda:       () => {},
  movimientosHacienda:    [],
  setMovimientosHacienda: () => {},
  archivosPlanos:         [],
  setArchivosPlanos:      () => {},
  planoBlobMap:           {},
  setPlanoBlobMap:        () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [fileStore,            setFileStore]            = useState<File[]>([]);
  const [documents,            setDocuments]            = useState<UploadedDoc[]>([]);
  const [generatedReports,     setGeneratedReports]     = useState<GeneratedReport[]>([]);
  const [analysisResult,       setAnalysisResult]       = useState<AnalysisResult | null>(null);
  const [campos,               setCampos]               = useState<Campo[]>([]);
  const [planSiembra,          setPlanSiembra]          = useState<Lote[]>([]);
  const [campanaActual,        setCampanaActual]        = useState<string>("2025/26");
  const [stockHacienda,        setStockHacienda]        = useState<StockPorCampo[]>([]);
  const [movimientosHacienda,  setMovimientosHacienda]  = useState<MovimientoHacienda[]>([]);
  const [archivosPlanos,       setArchivosPlanos]       = useState<ArchivoPlano[]>([]);
  const [planoBlobMap,         setPlanoBlobMap]         = useState<Record<string, File>>({});
  const [hydrated,             setHydrated]             = useState(false);

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    try {
      const savedDocs       = localStorage.getItem("agroforma_documents");
      const savedReports    = localStorage.getItem("agroforma_reports");
      const savedAnalysis   = localStorage.getItem("agroforma_analysis");
      const savedCampos     = localStorage.getItem("agroforma_campos");
      const savedPlan       = localStorage.getItem("agroforma_plan_siembra");
      const savedCampana    = localStorage.getItem("agroforma_campana");
      const savedStock      = localStorage.getItem("agroforma_stock_hacienda");
      const savedMovimientos = localStorage.getItem("agroforma_movimientos_hacienda");
      if (savedDocs)        setDocuments(JSON.parse(savedDocs));
      if (savedReports)     setGeneratedReports(JSON.parse(savedReports));
      if (savedAnalysis)    setAnalysisResult(JSON.parse(savedAnalysis));
      if (savedCampos)      setCampos(JSON.parse(savedCampos));
      if (savedPlan)        setPlanSiembra(JSON.parse(savedPlan));
      if (savedCampana)     setCampanaActual(savedCampana);
      if (savedStock)       setStockHacienda(JSON.parse(savedStock));
      if (savedMovimientos) setMovimientosHacienda(JSON.parse(savedMovimientos));
      const savedPlanos = localStorage.getItem("agroforma_planos");
      if (savedPlanos) setArchivosPlanos(JSON.parse(savedPlanos));
    } catch { /* localStorage unavailable or corrupted */ }
    setHydrated(true);
  }, []);

  // ── Persist on change ─────────────────────────────────────────────────────
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_documents", JSON.stringify(documents)); }, [documents, hydrated]);
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_reports", JSON.stringify(generatedReports)); }, [generatedReports, hydrated]);
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_analysis", JSON.stringify(analysisResult)); }, [analysisResult, hydrated]);
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_campos", JSON.stringify(campos)); }, [campos, hydrated]);
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_plan_siembra", JSON.stringify(planSiembra)); }, [planSiembra, hydrated]);
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_campana", campanaActual); }, [campanaActual, hydrated]);
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_stock_hacienda", JSON.stringify(stockHacienda)); }, [stockHacienda, hydrated]);
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_movimientos_hacienda", JSON.stringify(movimientosHacienda)); }, [movimientosHacienda, hydrated]);
  useEffect(() => { if (!hydrated) return; localStorage.setItem("agroforma_planos", JSON.stringify(archivosPlanos)); }, [archivosPlanos, hydrated]);

  return (
    <AppContext.Provider value={{
      fileStore, setFileStore,
      documents, setDocuments,
      generatedReports, setGeneratedReports,
      analysisResult, setAnalysisResult,
      campos, setCampos,
      planSiembra, setPlanSiembra,
      campanaActual, setCampanaActual,
      stockHacienda, setStockHacienda,
      movimientosHacienda, setMovimientosHacienda,
      archivosPlanos, setArchivosPlanos,
      planoBlobMap, setPlanoBlobMap,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);

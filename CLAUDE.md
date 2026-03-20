# AgroForma — La inteligencia artificial de la empresa agropecuaria argentina

## Qué es
Herramienta web donde empresas agropecuarias argentinas suben su documentación (balances, extractos, liquidaciones, planillas) y la IA la analiza, estructura y genera reportes descargables.

## Tech Stack
- Next.js 16 con App Router + TypeScript
- Tailwind CSS v4
- Supabase (Auth, Postgres, Storage)
- API de Anthropic (claude-sonnet-4-6) para procesamiento de documentos y chat
- ExcelJS para generación de Excel
- jsPDF + jspdf-autotable para generación de PDF
- Recharts para gráficos
- Leaflet + react-leaflet para mapas
- Deploy: Vercel

## Variables de entorno (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` — URL pública del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Key anónima de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Key de admin (solo server-side)
- `ANTHROPIC_API_KEY` — API key de Anthropic para Claude

## Tablas de Supabase
- **empresas** — Tabla principal de empresas (id, user_id, nombre, cuit, actividad, provincia, localidad, campana_activa, created_at)
- **empresa_state** — KV store por empresa para persistir estado (empresa_id, key, value, updated_at). Conflict on (empresa_id, key).
- **documentos** (Storage bucket) — Archivos subidos. Path: `{user_id}/{empresa_id}/{timestamp}_{filename}`

## Funcionalidades
- **Dashboard**: KPIs, carga de documentos, análisis automático, generación de reportes
- **12 reportes funcionales**: Situación Patrimonial, Margen Bruto, Ratios, Bridge, Break-Even, Calificación Bancaria, Evolución Histórica, EBITDA, Real vs Presupuestado, Resultado por UN, Dashboard Mensual, Seguimiento Campaña
- **Chat**: Asistente conversacional con contexto de la empresa y documentos
- **Escenarios what-if**: Guardar variantes de reportes desde el chat
- **Documentos**: Lista de archivos subidos con previsualización
- **Reportes**: Historial completo con descarga en Excel y PDF
- **Portfolio**: Vista multi-empresa para contadores
- **Presentaciones**: Generación de presentaciones desde documentos
- **Gestión agrícola/ganadera**: Mapas de campos, stock ganadero, movimientos
- **Configuración**: Datos de empresa, multi-empresa

## Reportes pendientes
- Proyección de Campaña (requiere plan de siembra)
- Ranking de Campos (requiere detalle por campo)

## Estructura del proyecto
```
src/
├── app/                          # Pages y API routes (App Router)
│   ├── page.tsx                  # Dashboard principal
│   ├── layout.tsx                # Root layout (Auth + App providers, fonts)
│   ├── chat/page.tsx
│   ├── config/page.tsx
│   ├── docs/page.tsx
│   ├── escenarios/page.tsx
│   ├── gestion/agricola/page.tsx
│   ├── gestion/ganadera/page.tsx
│   ├── login/page.tsx
│   ├── portfolio/page.tsx
│   ├── presentaciones/page.tsx
│   ├── registro/page.tsx
│   ├── reportes/page.tsx
│   ├── auth/callback/route.ts    # OAuth callback para Supabase
│   └── api/
│       ├── analizar-documentos/  # Análisis automático + extracción por doc
│       ├── chat/                 # Chat + generación de Excel desde chat
│       ├── gestion/              # Análisis de planos y hacienda
│       ├── portfolio/            # Análisis y descarga de portfolio
│       ├── presentaciones/       # Generación de presentaciones
│       ├── reportes/             # 12 reportes (cada uno con route.ts + download/)
│       └── storage/              # Descarga de archivos de Supabase Storage
│
├── components/                   # Componentes de UI
│   ├── AuthLayout.tsx            # Layout compartido login/registro (slideshow)
│   ├── ChatClient.tsx            # Chat conversacional
│   ├── ConfigClient.tsx          # Configuración de empresa
│   ├── DashboardClient.tsx       # Dashboard principal con carga y reportes
│   ├── DocPreviewModal.tsx       # Modal de previsualización de documentos
│   ├── DocsClient.tsx            # Lista de documentos subidos
│   ├── EscenariosClient.tsx      # Escenarios what-if
│   ├── NuevaEmpresaModal.tsx     # Modal de creación de empresa
│   ├── PortfolioClient.tsx       # Vista multi-empresa
│   ├── PresentacionesClient.tsx  # Presentaciones
│   ├── ReportPreviewModal.tsx    # Modal de previsualización de reportes
│   ├── ReportsClient.tsx         # Historial de reportes
│   ├── Sidebar.tsx               # Navegación lateral
│   ├── UploadModal.tsx           # Modal de carga de archivos
│   ├── charts/ReportCharts.tsx   # Gráficos con Recharts
│   ├── dashboard/                # Sub-componentes del dashboard
│   │   ├── DocumentAnalysis.tsx  # Cards de reportes disponibles/no disponibles
│   │   ├── DocumentsTable.tsx    # Tabla de documentos detectados
│   │   ├── GeneratedReportsSection.tsx
│   │   ├── KpiCard.tsx
│   │   └── ReportCard.tsx
│   └── gestion/                  # Sub-componentes de gestión
│       ├── AgricolaClient.tsx
│       ├── CampoDiagrama.tsx
│       ├── GanaderaClient.tsx
│       ├── LeafletMap.tsx
│       └── TabMapa.tsx
│
├── context/
│   ├── AppContext.tsx             # Estado global (empresa, docs, reportes, análisis)
│   └── AuthContext.tsx            # Autenticación con Supabase
│
├── lib/
│   ├── constants.ts              # REPORT_LABELS, COLORS (paleta compartida)
│   ├── download.ts               # Utilidad de descarga de archivos
│   ├── extractJSON.ts            # Extracción de JSON de respuestas de Claude
│   ├── agente/context.ts         # Contexto del agente para chat
│   ├── excel/                    # Generadores de Excel (uno por reporte)
│   ├── pdf/report-pdf.ts         # Generador de PDF para reportes
│   ├── reportes/generate.ts      # Helper compartido para generación de reportes
│   └── supabase/
│       ├── admin.ts              # Cliente con service role key
│       ├── client.ts             # Cliente browser-side
│       ├── db.ts                 # CRUD de empresas + KV store (empresa_state)
│       ├── server.ts             # Cliente server-side (cookies)
│       └── storage.ts            # Upload/download de archivos
│
└── types/
    ├── analysis.ts               # ExtractedDocData, AnalysisResult, ReportePosible
    ├── document.ts               # DocType, UploadedDoc
    ├── empresa.ts                # Empresa, EmpresaFormData
    ├── gestion.ts                # Campos, lotes, hacienda, provincias, cultivos
    ├── presentacion.ts           # Presentacion, PresentacionTipo
    └── report.ts                 # GeneratedReport
```

## Patrones clave
- **pendingRestore**: Ref en AppContext para restaurar estado después de crear empresa
- **empresa_state como KV**: Cada dato de la empresa se guarda como key-value (documents, analysis, extracted_docs, etc.)
- **extractedDocsData + extractedTexts**: Datos estructurados + textos raw se envían juntos a los reportes
- **ROUTE_MAP**: Mapeo de analysis_id → API path en DashboardClient
- **Storage paths**: `{user_id}/{empresa_id}/{timestamp}_{filename}` para aislamiento

## Notas
- La app analiza dinámicamente qué documentos subió el usuario y habilita solo los reportes posibles
- Los reportes que necesitan más documentación aparecen deshabilitados explicando qué falta
- Reportes parciales muestran advertencia amarilla cuando faltan datos complementarios
- No es un sistema de gestión, es una herramienta que se monta encima de lo que ya tiene la empresa

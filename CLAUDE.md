# AgroForma — La inteligencia artificial de la empresa agropecuaria argentina

## Qué es
Herramienta web donde empresas agropecuarias argentinas suben su documentación (balances, extractos, liquidaciones, planillas) y la IA la analiza, estructura y genera reportes descargables.

## Estado actual del MVP
- Landing page deployeada en Vercel
- App Next.js funcionando con:
  - Carga de documentos (PDF, Excel, CSV)
  - Análisis automático de documentación (detecta qué tipo de docs son y qué reportes puede generar)
  - 4 reportes funcionales:
    1. Situación Patrimonial
    2. Margen Bruto por Cultivo
    3. Ratios e Indicadores
    4. Bridge de Resultados
  - Previsualización de reportes en la app
  - Descarga en Excel
  - Historial de reportes generados

## Reportes pendientes de construir
- Break-Even y tabla de sensibilidad
- Proyección de Campaña (requiere plan de siembra)
- Ranking de Campos (requiere detalle por campo)
- Calificación Bancaria (requiere datos adicionales de campos, hacienda, maquinaria)

## Visión futura
- Dashboard que se construye a medida que se cargan documentos
- Asistente conversacional que conoce la empresa
- Comparación entre campañas
- Alertas proactivas
- Multi-empresa para contadores
- Integración con precios de mercado

## Tech Stack
- Next.js con App Router + TypeScript
- Tailwind CSS
- API de Anthropic (Claude) para procesamiento de documentos
- ExcelJS para generación de Excel
- Deploy: Vercel

## Estructura del proyecto
- /src/app/page.tsx — Dashboard principal
- /src/app/api/analizar-documentos/ — Análisis automático de docs subidos
- /src/app/api/reportes/situacion-patrimonial/ — Genera reporte patrimonial
- /src/app/api/reportes/margen-bruto/ — Genera margen bruto por cultivo
- /src/app/api/reportes/ratios/ — Genera ratios e indicadores
- /src/app/api/reportes/bridge/ — Genera bridge de resultados
- /src/components/ — Componentes de UI
- /src/lib/excel/ — Generadores de Excel por reporte
- .env.local — API key de Anthropic (NO commitear)

## Archivos de referencia
- Formulario CREA de calificación bancaria (estructura para futuro reporte)
- Balance Iruya S.A. 2025 (documento de prueba)
- Mega Dashboard Iruya (referencia de estructura de reportes)

## Notas
- La app analiza dinámicamente qué documentos subió el usuario y habilita solo los reportes posibles
- Los reportes que necesitan más documentación aparecen deshabilitados explicando qué falta
- No es un sistema de gestión, es una herramienta que se monta encima de lo que ya tiene la empresa

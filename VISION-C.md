# AgroForma v3 — Módulo C: "Margen por Lote → Decisión Productiva"

## Origen
Basado en el estudio ENPA 2025 (Universidad Austral) sobre adopción digital en el agro argentino.
Hallazgos que fundamentan este módulo:
- El hardware ya está (87% monitores). El cuello de botella es **convertir datos en decisiones**.
- Barrera #1: falta de conocimiento (48%), no conectividad (20%).
- Brecha por escala: software de gestión 42% en grandes vs **12% en medianos** → mercado objetivo.
- El **asesor técnico** es el canal (53% comparte datos con su asesor). No el productor directo.
- Motivación principal: **reducir costos** (81%), no aumentar ingresos.
- 40% de adoptantes avanzados dice que la tecnología "no resuelve un problema productivo concreto".

## Posicionamiento
AgroForma C es el **intermedio** entre:
- **A (financiero):** reportes contables sobre el balance — ya construido (~80%).
- **B (agronómico):** prescripción de tasa variable — requiere motor geoestadístico, alto riesgo.

C = **margen económico a nivel lote/cultivo/ambiente**. Input agronómico, lógica financiera.
Reusa el stack actual (Claude + patrón de reportes). Cero geoestadística.

## Qué ya existe (NO reconstruir)
- `AgricolaClient.tsx`: plan de siembra que ya calcula margen por lote, por cultivo (`byCultivo`),
  margen total y margen por hectárea (`margenHa`).
- Tipo `Lote` en `types/gestion.ts` con cultivo, hectáreas, rendimientoEsperado, precioEsperado, costosDirectos.
- Patrón `generateReport` en `lib/reportes/generate.ts` (Claude sonnet-4-6 + extracción JSON).
- Escenarios what-if (`EscenariosClient.tsx`).
- Análisis de documentos que ya lee balances/liquidaciones.

## Alcance versión "convincente" (MVP + 2)

### 1. Rinde/precio/costo REAL (no solo esperado)
Agregar a `Lote`:
```ts
rendimientoReal?: number;  // tn/ha obtenido
precioReal?: number;       // USD/tn venta efectiva
costosReales?: number;     // USD/ha ejecutado
```
Valor: comparar planeado vs obtenido → ahí aparece la decisión.

### 2. Capa de interpretación con Claude
Nueva API route `/api/gestion/analisis-margen-lote`:
- Input: array de lotes (esperado + real) + benchmark.
- Output: ranking por margen/ha, diagnóstico por lote, recomendación accionable.
- Reusa patrón de `generate.ts`.

### 3. Ingesta de liquidación (quita fricción de carga)
El productor sube la liquidación de la cooperativa/acopio → Claude extrae rinde y precio
efectivo por cultivo y precarga los campos reales. Reusa el flujo de análisis de documentos.

### 4. Benchmark básico
Dataset de márgenes/costos promedio por zona y cultivo (cargar como JSON estático inicial,
fuente CREA/zona). Permite que la recomendación tenga un "contra qué".

## Fuera de alcance (después)
- Viabilidad agronómica dura (qué cultivo aguanta cada lote según suelo/agua/fecha).
- Ingesta de export de monitor (formatos JD/Case/Trimble).
- Prescripción de tasa variable (Módulo B).

## MVP en una frase
> El asesor/productor carga (o sube la liquidación de) sus lotes con cultivo, rinde y costos;
> AgroForma calcula el margen por lote/cultivo/ha, lo rankea contra un benchmark de zona,
> y Claude dice cuál lote conviene cambiar y a qué — con escenarios de rotación.

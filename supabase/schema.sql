-- =============================================================================
-- AgroForma — Schema SQL
-- Ejecutar en: Supabase > SQL Editor
-- =============================================================================

-- Empresas (el usuario se maneja con Supabase Auth, no necesita tabla propia)
CREATE TABLE empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cuit TEXT,
  actividad TEXT,
  provincia TEXT,
  localidad TEXT,
  campana_activa TEXT DEFAULT '2025/26',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- pdf, xlsx, csv
  categoria TEXT,     -- balance, plan_siembra, liquidacion, etc
  tamano BIGINT,
  periodo TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE datos_extraidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID REFERENCES documentos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- analisis, situacion_patrimonial, ventas_cultivo, etc
  datos JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reportes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- situacion_patrimonial, margen_bruto, ratios, bridge, etc
  nombre TEXT NOT NULL,
  datos JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE escenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  reporte_original_id UUID REFERENCES reportes(id),
  nombre TEXT NOT NULL,
  instruccion TEXT NOT NULL,
  datos JSONB NOT NULL,
  tipo_reporte TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE campos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  provincia TEXT,
  localidad TEXT,
  superficie_total DECIMAL,
  tipo TEXT DEFAULT 'propio',      -- propio, arrendado, aparceria
  aptitud TEXT DEFAULT 'agricola', -- agricola, ganadera, mixta
  valor_arriendo DECIMAL,
  coordenadas TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plan_siembra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  campo_id UUID REFERENCES campos(id) ON DELETE CASCADE,
  campana TEXT NOT NULL,
  cultivo TEXT NOT NULL,
  hectareas DECIMAL,
  rinde_esperado DECIMAL,
  rinde_real DECIMAL,
  precio_usd_tn DECIMAL,
  costo_implantacion DECIMAL,
  costo_proteccion DECIMAL,
  costo_cosecha DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stock_hacienda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  campo_id UUID REFERENCES campos(id),
  categoria TEXT NOT NULL,
  cabezas_propias INTEGER DEFAULT 0,
  cabezas_terceros INTEGER DEFAULT 0,
  raza TEXT,
  fecha_stock DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  titulo TEXT,
  mensajes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE presentaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamano BIGINT,
  resumen_ia JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- Row Level Security — cada usuario solo ve sus datos
-- =============================================================================

ALTER TABLE empresas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE datos_extraidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE escenarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE campos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_siembra   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_hacienda ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentaciones ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Policies — usuarios solo acceden a sus empresas
-- =============================================================================

CREATE POLICY "Users can CRUD own empresas"
  ON empresas FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own documentos"
  ON documentos FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own datos_extraidos"
  ON datos_extraidos FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own reportes"
  ON reportes FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own escenarios"
  ON escenarios FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own campos"
  ON campos FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own plan_siembra"
  ON plan_siembra FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own stock_hacienda"
  ON stock_hacienda FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own conversaciones"
  ON conversaciones FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own presentaciones"
  ON presentaciones FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

-- =============================================================================
-- EMPRESA STATE — KV store for per-empresa app state (documents, reports, etc.)
-- Stores all complex app state as JSONB blobs, keyed by type name.
-- =============================================================================

CREATE TABLE IF NOT EXISTS empresa_state (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       JSONB,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, key)
);

ALTER TABLE empresa_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own empresa_state"
  ON empresa_state FOR ALL
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER empresa_state_updated_at
  BEFORE UPDATE ON empresa_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- MonitoraEngine - Schema SQL para Supabase PostgreSQL
-- Execute este script no SQL Editor do Supabase

-- ================================================
-- 1. CRIAR TABELA DE TELEMETRIA
-- ================================================

CREATE TABLE IF NOT EXISTS telemetry_events (
  id bigserial PRIMARY KEY,
  device_id text NOT NULL,
  ts timestamptz NOT NULL,
  lat double precision,
  lon double precision,
  speed_kmh double precision,
  engine_temp_c double precision,
  battery_v double precision,
  created_at timestamptz DEFAULT now()
);

-- ================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índice composto para queries por device + ordenação temporal
CREATE INDEX IF NOT EXISTS idx_telemetry_device_ts 
ON telemetry_events(device_id, ts DESC);

-- Índice para queries temporais gerais
CREATE INDEX IF NOT EXISTS idx_telemetry_ts 
ON telemetry_events(ts DESC);

-- Índice para busca por device
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id 
ON telemetry_events(device_id);

-- Índice para alertas de velocidade
CREATE INDEX IF NOT EXISTS idx_telemetry_speed 
ON telemetry_events(speed_kmh) 
WHERE speed_kmh > 90;

-- ================================================
-- 3. COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================

COMMENT ON TABLE telemetry_events IS 'Eventos de telemetria de devices';
COMMENT ON COLUMN telemetry_events.device_id IS 'Identificador único do device (ex: TRK-001)';
COMMENT ON COLUMN telemetry_events.ts IS 'Timestamp do evento em UTC';
COMMENT ON COLUMN telemetry_events.lat IS 'Latitude em graus decimais';
COMMENT ON COLUMN telemetry_events.lon IS 'Longitude em graus decimais';
COMMENT ON COLUMN telemetry_events.speed_kmh IS 'Velocidade em km/h';
COMMENT ON COLUMN telemetry_events.engine_temp_c IS 'Temperatura do motor em Celsius';
COMMENT ON COLUMN telemetry_events.battery_v IS 'Voltagem da bateria';

-- ================================================
-- 4. EXEMPLO DE DADOS (OPCIONAL - PARA TESTE)
-- ================================================

-- Inserir alguns eventos de exemplo para teste
-- Descomente se quiser dados iniciais

/*
INSERT INTO telemetry_events (device_id, ts, lat, lon, speed_kmh, engine_temp_c, battery_v)
VALUES
  ('TRK-001', NOW() - INTERVAL '10 seconds', -23.5505, -46.6333, 65.5, 88.2, 12.4),
  ('TRK-001', NOW() - INTERVAL '5 seconds', -23.5515, -46.6343, 72.3, 89.1, 12.4),
  ('TRK-002', NOW() - INTERVAL '8 seconds', -23.5525, -46.6353, 45.8, 85.5, 12.6),
  ('TRK-003', NOW() - INTERVAL '3 seconds', -23.5535, -46.6363, 95.2, 98.7, 12.3);
*/

-- ================================================
-- 5. VERIFICAÇÕES
-- ================================================

-- Verificar se a tabela foi criada
SELECT 
  tablename, 
  schemaname 
FROM pg_tables 
WHERE tablename = 'telemetry_events';

-- Verificar índices criados
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'telemetry_events';

-- ================================================
-- FIM DO SCRIPT
-- ================================================

-- ============================================================
-- SEED: catálogo de materias (se siembra una sola vez)
-- Ejecutar DESPUÉS de schema.sql y ANTES de crear paralelos.
-- ============================================================

insert into public.materias (nombre, semestre) values
  ('Redes Eléctricas',       '3ero'),
  ('Sistemas Digitales',     '4to'),
  ('Plataformas de Hardware', '5to');

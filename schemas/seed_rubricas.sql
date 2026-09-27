-- ============================================================
-- SEED: rúbricas de calificación y coevaluación — v2
-- Cambios respecto a la versión anterior (CALIF_EXPOSITOR → Diapositivas):
--   • "Contiene información pertinente al tema": ahora 4 niveles
--     Siempre 15 / Frecuentemente 10 / A veces 5 / Nunca 0  (antes máx. 10).
--   • "Referencias bibliográficas en diapositivas": ahora 3 niveles
--     Siempre 10 / A veces 5 / No 0  (antes máx. 15, con 4 opciones).
--   El total de la categoría Diapositivas sigue siendo 40 pts.
--
-- Ejecutar UNA SOLA VEZ, después de aplicar schema.sql,
-- en el SQL Editor de Supabase Studio.
-- ============================================================

do $$
declare
  r_id uuid;
  c_id uuid;
  k_id uuid;
begin

  -- ================= CALIF_EXPOSITOR =================
  insert into public.rubricas (tipo, nombre, nota_especial) values (
    'CALIF_EXPOSITOR',
    'Calificación del expositor (docente)',
    'La exposición debe repartirse equitativamente en subtemas entre todos los integrantes. '
    'Si no se cumple, el estudiante obtiene como máximo el 50 % de la calificación.'
  ) returning id into r_id;

  -- --- Informe (30 pts) ---
  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Informe', 1) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Cumple con formato estándar',
    'No olvidar contextualizar los campos de carátula respecto al tema de exposición. '
    'Incluir capturas de pantalla completas de las fuentes bibliográficas. '
    'Los criterios personales no deben ser escuetos ni desarrollados exclusivamente con IA.',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',        15, 1),
    (k_id, 'Frecuentemente', 10, 2),
    (k_id, 'A veces',         5, 3),
    (k_id, 'Nunca',           0, 4);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Referencias bibliográficas',
    'Debe utilizar norma IEEE para referenciar.',
    2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Al menos dos libros indicados en el sílabo o biblioteca UTMACH', 15, 1),
    (k_id, 'Al menos un libro indicado en el sílabo o biblioteca UTMACH',    10, 2),
    (k_id, 'Mayoritariamente páginas web',                                     5, 3),
    (k_id, 'No presenta',                                                      0, 4);

  -- --- Diapositivas (40 pts) ---
  -- CRITERIO 1: Formato estándar → 15 pts max (sin cambio)
  -- CRITERIO 2: Contiene información pertinente → ahora 15 pts max (antes 10)
  --             4 niveles: Siempre 15 / Frecuentemente 10 / A veces 5 / Nunca 0
  -- CRITERIO 3: Referencias bibliográficas en diapositivas → ahora 10 pts max (antes 15)
  --             3 niveles: Siempre 10 / A veces 5 / No 0
  -- Total: 15 + 15 + 10 = 40 ✓
  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Diapositivas', 2) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Formato estándar',
    'Utilizar la plantilla del profesor. Máximo 5 diapositivas por participante o 10 minutos de exposición. '
    'En ejercicios, mostrar todos los pasos con transiciones y verificar con simulador de ser necesario.',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',        15, 1),
    (k_id, 'Frecuentemente', 10, 2),
    (k_id, 'A veces',         5, 3),
    (k_id, 'Nunca',           0, 4);

  -- ★ CAMBIO: 4 niveles, máx. 15 pts (antes 3 niveles, máx. 10 pts)
  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Contiene información pertinente al tema',
    'Revisar contenidos correspondientes a cada tema según el sílabo.',
    2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',        15, 1),
    (k_id, 'Frecuentemente', 10, 2),
    (k_id, 'A veces',         5, 3),
    (k_id, 'Nunca',           0, 4);

  -- ★ CAMBIO: 3 niveles, máx. 10 pts (antes 4 niveles, máx. 15 pts)
  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Referencias bibliográficas en diapositivas',
    'El contenido presentado debe constar en el marco teórico.',
    3
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',  10, 1),
    (k_id, 'A veces',   5, 2),
    (k_id, 'No',        0, 3);

  -- --- Exposición oral (30 pts) ---
  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Exposición oral', 3) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Realiza lecturas extensas de información',
    'Usar organizadores gráficos o imágenes en vez de leer texto extenso en las diapositivas.',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'No',      15, 1),
    (k_id, 'A veces', 10, 2),
    (k_id, 'Siempre',  5, 3);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Transmite claramente la información',
    'Una buena investigación y preparación ayuda a manejar el nerviosismo propio de exponer ante un público.',
    2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',  15, 1),
    (k_id, 'A veces',  10, 2),
    (k_id, 'No',        5, 3);

  -- ================= CALIF_EVALUADOR =================
  insert into public.rubricas (tipo, nombre) values (
    'CALIF_EVALUADOR', 'Calificación del evaluador (docente)'
  ) returning id into r_id;

  -- --- Informe (30 pts) ---
  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Informe', 1) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Cumple con formato estándar',
    'No olvidar contextualizar los campos de carátula respecto al tema de exposición. '
    'Incluir capturas de pantalla completas de las fuentes bibliográficas.',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',        15, 1),
    (k_id, 'Frecuentemente', 10, 2),
    (k_id, 'A veces',         5, 3),
    (k_id, 'Nunca',           0, 4);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Referencias bibliográficas',
    'Las preguntas deben extraerse o constar explícitamente en el marco teórico presentado. Usar norma IEEE.',
    2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Al menos dos libros indicados en el sílabo o biblioteca UTMACH', 15, 1),
    (k_id, 'Al menos un libro indicado en el sílabo o biblioteca UTMACH',    10, 2),
    (k_id, 'Mayoritariamente páginas web',                                     5, 3),
    (k_id, 'No presenta',                                                      0, 4);

  -- --- Cuestionario (40 pts) ---
  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Cuestionario', 2) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Referencia las preguntas',
    'El cuestionario debe indicarse en el ítem 1.2 (Solución o resultados) del informe. '
    'Si no está explícita en el marco teórico, indicar "Elaboración propia" (o con IA, si aplica). '
    'Todas las preguntas deben tener 4 opciones.',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',        20, 1),
    (k_id, 'Frecuentemente', 10, 2),
    (k_id, 'A veces',         5, 3),
    (k_id, 'Nunca',           0, 4);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Tienen coherencia las preguntas', null, 2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',        20, 1),
    (k_id, 'Frecuentemente', 10, 2),
    (k_id, 'A veces',         5, 3),
    (k_id, 'Nunca',           0, 4);

  -- --- Aplicación del cuestionario (30 pts) ---
  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Aplicación del cuestionario', 3) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Herramienta informática utilizada',
    'Ejemplos apropiados: Quizizz, Formularios de Google. Requiere visto bueno previo del profesor.',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Apropiada',                      15, 1),
    (k_id, 'No apropiada',                   10, 2),
    (k_id, 'No se aplica el cuestionario',    5, 3);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Cantidad de preguntas elaboradas',
    'Entre 5 y 10 preguntas, balanceando teoría y ejercicios; al menos 2 de resolución práctica; '
    'máximo 15 min de aplicación.',
    2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Adecuada',                        15, 1),
    (k_id, 'No adecuada',                     10, 2),
    (k_id, 'Insuficiente o no se aplica',      5, 3);

  -- ================= COEVAL_EXPOSITOR =================
  -- Categoría única: Exposición oral (ponderado a 50 % de la nota de coevaluación)
  insert into public.rubricas (tipo, nombre) values (
    'COEVAL_EXPOSITOR', 'Coevaluación de expositores (compañeros)'
  ) returning id into r_id;

  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Exposición oral', 1) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Realiza lecturas extensas de información', null, 1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'No',      25, 1),
    (k_id, 'A veces', 15, 2),
    (k_id, 'Siempre',  5, 3);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Transmite claramente la información', null, 2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',  25, 1),
    (k_id, 'A veces',  15, 2),
    (k_id, 'No',        5, 3);

  -- ================= COEVAL_EVALUADOR =================
  -- Categoría única: Aplicación del cuestionario (ponderado a 30 % de la nota de coevaluación)
  insert into public.rubricas (tipo, nombre) values (
    'COEVAL_EVALUADOR', 'Coevaluación del evaluador (compañeros)'
  ) returning id into r_id;

  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Aplicación del cuestionario', 1) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Herramienta informática utilizada', null, 1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Apropiada',                     15, 1),
    (k_id, 'No apropiada',                  10, 2),
    (k_id, 'No se aplica el cuestionario',   5, 3);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Cantidad de preguntas elaboradas', null, 2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Adecuada',                       15, 1),
    (k_id, 'No adecuada',                    10, 2),
    (k_id, 'Insuficiente o no se aplica',     5, 3);

end $$;

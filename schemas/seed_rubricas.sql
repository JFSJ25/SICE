-- ============================================================
-- SEED: rúbricas de calificación y coevaluación — v2
-- Cambios respecto a la versión anterior (CALIF_EXPOSITOR → Diapositivas):
--   • "Contiene información pertinente al tema": ahora 4 niveles
--     Siempre 15 / Frecuentemente 10 / A veces 5 / Nunca 0  (antes máx. 10).
--   • "Referencias bibliográficas en diapositivas": ahora 3 niveles
--     Siempre 10 / A veces 5 / No 0  (antes máx. 15, con 4 opciones).
--   La calificación docente del expositor suma 70 pts (Informe + Diapositivas).
--   La exposición oral se evalúa únicamente mediante la coevaluación estudiantil.
--   La aplicación del cuestionario se evalúa únicamente en COEVAL_EVALUADOR.
--
-- Ejecutar UNA SOLA VEZ, después de aplicar schema.sql,
-- en el SQL Editor de Supabase Studio.
-- ============================================================

create unique index if not exists rubricas_tipo_version_unique
  on public.rubricas (tipo, version);

do $$
declare
  r_id uuid;
  c_id uuid;
  k_id uuid;
begin

  -- ================= CALIF_EXPOSITOR =================
  -- Solo Informe (30 pts) + Diapositivas (40 pts) = 70 pts.
  -- La exposición oral NO se califica aquí: se evalúa en COEVAL_EXPOSITOR.
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
    'No olvidar contextualizar campos de carátula del informe respecto a su tema de exposición. '
    'Coloque capturas de pantallas de todo el contenido de sus fuentes bibliográficas que vaya a presentar en sus exposiciones '
    '(Las imágenes deben mostrar el entorno completo de la consulta). Los criterios personales no deben ser escuetos, '
    'ni desarrollados exclusivamente con IA.',
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
    'Utilizar la plantilla proporcionada por el profesor. Máximo 5 diapositivas por participante o 10 minutos de exposición. '
    'Utilice organizadores gráficos o imágenes en lugar de textos extensos. Para la presentacíón de un ejercicio, '
    'el enunciado debe ser coherente y específico, así como también se deberán presentar todos los pasos realizados, '
    'utilizando transiciones en las diapositivas y verificando su respuesta haciendo uso de un simulador de ser necesario.',
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
    'Contenido presentado en las diapositivas debe constar en el marco teórico.',
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

  -- ================= CALIF_EVALUADOR =================
  -- Solo Informe (30 pts) + Cuestionario (40 pts) = 70 pts.
  -- La aplicación del cuestionario NO se califica aquí: se evalúa en COEVAL_EVALUADOR.
  insert into public.rubricas (tipo, nombre) values (
    'CALIF_EVALUADOR', 'Calificación del evaluador (docente)'
  ) returning id into r_id;

  -- --- Informe (30 pts) ---
  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Informe', 1) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id,
    'Cumple con formato estándar',
    'No olvidar contextualizar campos de carátula del informe respecto a su tema de exposición. '
    'Coloque capturas de pantallas de todo el contenido de sus fuentes bibliográficas que vaya a presentar en sus exposiciones '
    '(Las imágenes deben mostrar el entorno completo de la consulta). Los criterios personales no deben ser escuetos, '
    'ni desarrollados exclusivamente con IA.',
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
    'Las preguntas realizadas deben ser extraídas o constar explícitamente en el marco teórico presentado. '
    'Debe utilizar norma IEEE para referenciar.',
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
    'El cuestionario debe estar indicado en el ítem 1.2 SOLUCIÓN O RESULTADOS del Informe presentado. '
    'En el caso de que la pregunta no esté explícita en el Marco Teórico, sino que fue extraída del mismo mediante un proceso analítico propio, '
    'deberá indicar como referencia la descripción "Elaboración propia". Todas las preguntas deben tener 4 opciones de respuesta. '
    'En caso de utilizar IA, referenciar indicando "Elaboración propia con uso de IA (ChatGPT, Gemini, DeepSeek, ...)"',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',        20, 1),
    (k_id, 'Frecuentemente', 10, 2),
    (k_id, 'A veces',         5, 3),
    (k_id, 'Nunca',           0, 4);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Tienen coherencia las preguntas',
    'El cuestionario debe estar indicado en el ítem 1.2 SOLUCIÓN O RESULTADOS del Informe presentado. '
    'En el caso de que la pregunta no esté explícita en el Marco Teórico, sino que fue extraída del mismo mediante un proceso analítico propio, '
    'deberá indicar como referencia la descripción "Elaboración propia". Todas las preguntas deben tener 4 opciones de respuesta. '
    'En caso de utilizar IA, referenciar indicando "Elaboración propia con uso de IA (ChatGPT, Gemini, DeepSeek, ...)"',
    2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Siempre',        20, 1),
    (k_id, 'Frecuentemente', 10, 2),
    (k_id, 'A veces',         5, 3),
    (k_id, 'Nunca',           0, 4);

  -- (La categoría "Aplicación del cuestionario" ya no se califica aquí: se evalúa
  --  únicamente en COEVAL_EVALUADOR. Total docente del evaluador: 30 + 40 = 70 pts.)

  -- ================= COEVAL_EXPOSITOR =================
  -- Categoría única: Exposición oral (ponderado a 50 % de la nota de coevaluación)
  -- Es el único lugar donde se evalúa la exposición oral (ver migración incorporada arriba).
  insert into public.rubricas (tipo, nombre) values (
    'COEVAL_EXPOSITOR', 'Coevaluación de expositores (compañeros)'
  ) returning id into r_id;

  insert into public.rubrica_categorias (rubrica_id, nombre, orden)
    values (r_id, 'Exposición oral', 1) returning id into c_id;

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Realiza lecturas extensas de información',
    'En las diapositivas se sugiere utilizar organizadores gráficos o imágenes que permitan transmitir el contenido de una manera más amena, '
    'y que evite realizar lecturas extensas de texto en las diapositivas.',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'No',      25, 1),
    (k_id, 'A veces', 15, 2),
    (k_id, 'Siempre',  5, 3);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Transmite claramente la información',
    'Para manejar adecuadamente el nerviosismo propio de una presentación ante un público, es muy importante tener seguridad de lo que se habla, '
    'por lo cual es indispensable realizar una buena investigación y preparación del tema.',
    2
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
    c_id, 'Herramienta informática utilizada',
    'Ejemplos de herramientas apropiadas: Quizz, Formularios de Google. La aplicación del cuestionario requiere el visto bueno del profesor, '
    'previo la revisión del informe presentado por el estudiante a cargo, con la finalidad de evitar que el cuestionario no sea aplicado.',
    1
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Apropiada',                     15, 1),
    (k_id, 'No apropiada',                  10, 2),
    (k_id, 'No se aplica el cuestionario',   5, 3);

  insert into public.rubrica_criterios (categoria_id, nombre, observacion, orden) values (
    c_id, 'Cantidad de preguntas elaboradas',
    'Se sugiere un mínimo de 5 y un máximo de 10 preguntas. Se debe balancear las preguntas teóricas y de resolución de ejercicios, '
    'para un máximo de 15 minutos que podrá tomar la aplicación del cuestionario. Siempre deberán existir al menos dos (2) preguntas '
    'sobre resolución de ejercicios o aplicación práctica de los contenidos expuestos.',
    2
  ) returning id into k_id;
  insert into public.rubrica_opciones (criterio_id, etiqueta, puntos, orden) values
    (k_id, 'Adecuada',                       15, 1),
    (k_id, 'No adecuada',                    10, 2),
    (k_id, 'Insuficiente o no se aplica',     5, 3);

end $$;
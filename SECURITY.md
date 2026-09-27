# Auditoría de seguridad

Estado: revisión inicial. Las escrituras sobre paralelos y sus datos dependientes ya tienen una primera restricción por propietario; las lecturas y catálogos requieren revisión adicional antes de usar datos reales.

## Hallazgos

### 1. Lectura demasiado amplia de datos académicos

Varias políticas usan únicamente `auth.role() = 'authenticated'`. Esto permite que cualquier usuario autenticado consulte filas de tablas como `usuarios`, `matriculas`, `paralelos`, `grupos` y `grupo_miembros`.

El frontend necesita consultar algunos nombres y grupos para los flujos de coevaluación, pero el acceso debe limitarse al contexto académico correspondiente. El correo electrónico no debería exponerse a estudiantes si no es necesario.

### 2. Escritura global para todo el personal

La función `es_staff()` solo comprueba si el usuario tiene rol `profesor` o `admin`. Las políticas de escritura basadas exclusivamente en esa función permiten que cualquier profesor modifique materias, periodos, paralelos, grupos, matrículas, rúbricas y configuraciones de cualquier contexto.

Se añadió `puede_gestionar_paralelo()` y se actualizaron las políticas de escritura de paralelos, matrículas, hemisemestres, grupos, miembros, temas y configuración. Ahora distinguen entre:

- `admin`: administración global.
- `profesor`: modificación únicamente de paralelos cuyo `profesor_id` sea su propio usuario.

Las políticas de materias, periodos y rúbricas todavía usan `es_staff()` y requieren decidir si un profesor debe tener administración global de esos catálogos.

### 3. Escritura global de calificaciones

`calif_docente_write` fue restringida para comprobar que el usuario sea el profesor asignado al paralelo de la calificación, o un administrador.

### 4. Validación de relaciones en escrituras

Las políticas de inserción deben comprobar que las claves relacionadas pertenecen al contexto autorizado. Por ejemplo, un profesor no debería poder crear un grupo para un paralelo ajeno ni asociar una matrícula fuera de su paralelo.

## Aspectos correctos observados

- Las tablas tienen RLS habilitado.
- La `service_role` solo se utiliza en la Edge Function y no debe llegar al frontend.
- La función `obtener_coeval_promedio` usa `security definer`, fija `search_path` y comprueba autorización antes de devolver datos agregados.
- Existe una restricción de base de datos contra la auto-coevaluación.
- Los seeds revisados contienen únicamente materias y rúbricas, sin cuentas ni datos personales.

## Requisitos antes de publicar

1. Probar las políticas con cuentas separadas de administrador, profesor y estudiante.
2. Verificar lecturas y escrituras de un profesor sobre un paralelo propio y uno ajeno.
3. Verificar que un estudiante no pueda consultar correos o calificaciones de otros estudiantes.
4. Confirmar que la Edge Function rechace sesiones inválidas y roles no autorizados.
5. No cargar datos académicos reales hasta completar estas pruebas.

Las políticas no deben cambiarse solo desde el frontend: la restricción efectiva debe permanecer en PostgreSQL/RLS.

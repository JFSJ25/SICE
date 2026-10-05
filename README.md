# SICE

SICE es un Sistema de Registro y Calificación de Exposiciones para la UTMACH. Permite administrar paralelos, grupos de estudiantes, temas, calificaciones docentes y coevaluaciones.

## Tecnologías

- React 19
- Vite
- React Router con `HashRouter`
- Tailwind CSS
- Supabase Auth, Database y Edge Functions
- pnpm

## Requisitos

- Node.js 20 o superior
- pnpm
- Un proyecto de Supabase configurado

## Instalación local

```bash
pnpm install
```

Copia `.env.example` como `.env.local` y completa las variables:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

La clave `anon` puede estar en el frontend. No uses aquí una clave `service_role` ni otros secretos administrativos.

Inicia el servidor de desarrollo:

```bash
pnpm dev
```

Genera una compilación de producción:

```bash
pnpm build
```

Puedes revisar esa compilación localmente con:

```bash
pnpm preview
```

## Configuración de Supabase

Ejecuta los scripts en Supabase Studio, en este orden:

1. `schemas/schema.sql`
2. `schemas/seed_materias.sql`
3. `schemas/seed_rubricas.sql`

El esquema crea, entre otras, las tablas de usuarios, materias, periodos, paralelos, matrículas, hemisemestres, grupos, miembros, temas, rúbricas y calificaciones.

Para `Sistemas Digitales` y `Plataformas de Hardware`, al crear cada paralelo
se generan automáticamente siete grupos con los temas fijos del catálogo. La
asignación de integrantes es única para el paralelo (aplica a ambos
hemisemestres) y comienza abierta. Cada estudiante puede unirse, moverse,
cambiar entre expositor/evaluador y elegir ser líder desde `Mi grupo`.

El profesor finaliza la etapa desde `Grupos y temas`. La base de datos valida
que existan exactamente siete grupos, que todos tengan integrantes, que todos
los estudiantes matriculados pertenezcan a un solo grupo, que cada grupo
tenga exactamente un líder y que los grupos con más de tres integrantes
tengan un evaluador. Una etapa finalizada bloquea los cambios estudiantiles;
el profesor puede reabrirla explícitamente. `Redes Eléctricas` permanece
pendiente y no recibe grupos automáticos en esta versión.

Al insertar un paralelo, los triggers del esquema crean sus dos hemisemestres y la configuración inicial de notas. El sistema usa una ponderación de 70% para la calificación del profesor y 30% para la coevaluación.

### Edge Function

La función `crear-cuentas-estudiantes` crea cuentas de estudiantes desde Supabase. Necesita estas variables internas de Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` debe permanecer exclusivamente en el entorno de la Edge Function y nunca debe incluirse en el frontend ni en el repositorio.

Despliega la función con la CLI de Supabase:

```bash
supabase functions deploy crear-cuentas-estudiantes
```

La función exige una sesión autenticada y solo permite operar a usuarios con rol `profesor` o `admin`.

Las funciones `listar-estudiantes` y `restablecer-password-estudiante` permiten a un profesor o administrador buscar estudiantes y generar una contraseña temporal para recuperar su acceso. Despliégalas junto con la función de creación de cuentas:

```bash
supabase functions deploy listar-estudiantes
supabase functions deploy restablecer-password-estudiante
```

La contraseña temporal se muestra una sola vez en la interfaz administrativa. El estudiante puede cambiarla desde `Mi cuenta` usando su contraseña actual.

## Roles

- `admin`: administración general del sistema.
- `profesor`: gestión de paralelos, grupos, estudiantes, temas y calificaciones.
- `estudiante`: consulta de su grupo, coevaluaciones y notas.

El acceso se controla mediante autenticación, guardias de ruta en React y políticas RLS en Supabase. Las políticas RLS deben revisarse antes de publicar datos reales.

## Rutas principales

La aplicación usa `HashRouter` porque GitHub Pages no resuelve directamente las rutas de una SPA.

- `/#/login`
- `/#/profesor/grupos`
- `/#/profesor/pendientes`
- `/#/profesor/admin`
- `/#/estudiante/mi-grupo`
- `/#/estudiante/coevaluar`
- `/#/estudiante/notas`

## Estructura

```text
src/
├── components/       Componentes reutilizables y Shell de navegación
├── context/          Contexto de autenticación
├── lib/              Cliente Supabase, autenticación, datos y rúbricas
├── pages/             Vistas de profesores y estudiantes
├── App.jsx           Rutas y guardias de acceso
└── main.jsx          Punto de entrada

schemas/              Esquema y datos iniciales de Supabase
supabase/functions/   Edge Functions
public/               Archivos públicos, incluido .nojekyll
```

## GitHub Pages

El proyecto está configurado para un repositorio llamado `SICE` mediante `vite.config.js`:

```js
base: '/SICE/'
```

La URL esperada es:

```text
https://TU_USUARIO.github.io/SICE/
```

El build de producción se genera en `dist/`. El directorio `dist/` no se versiona porque es un artefacto generado.

Existe también el script:

```bash
pnpm deploy
```

Este ejecuta el build y publica `dist/` mediante `gh-pages`. Para un flujo automatizado se recomienda configurar posteriormente GitHub Actions y definir las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en la configuración del repositorio.

## Comprobaciones antes de publicar

- Ejecutar `pnpm build` sin errores.
- Confirmar que no haya claves privadas ni datos personales en el repositorio.
- Revisar las políticas RLS de todas las tablas.
- Probar los flujos de profesor y estudiante.
- Probar una recarga directa de la aplicación publicada.
- Verificar que las variables de entorno estén configuradas en el entorno de producción.

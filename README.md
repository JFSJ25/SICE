# SICE

SICE es una aplicación web para apoyar la organización y evaluación de exposiciones académicas. Reúne en un solo espacio herramientas para la gestión de cursos, estudiantes, grupos, calificaciones y coevaluaciones.

## Tecnologías

- React y Vite
- React Router
- Tailwind CSS y Material UI Icons
- Supabase Auth, Database y Edge Functions
- pnpm

## Requisitos

- Node.js 20 o superior
- pnpm
- Un proyecto de Supabase

## Inicio local

Instala las dependencias:

```bash
pnpm install
```

Configura las variables de entorno en `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

La clave pública `anon` se utiliza en el cliente. No agregues claves administrativas o secretos al frontend ni al repositorio.

Inicia el servidor de desarrollo:

```bash
pnpm dev
```

Para generar y revisar una compilación de producción:

```bash
pnpm build
pnpm preview
```

## Supabase

Configura la base de datos ejecutando, en este orden, los scripts del directorio `schemas/`:

1. `schema.sql`
2. `seed_materias.sql`
3. `seed_rubricas.sql`

```bash
supabase functions deploy crear-cuentas-estudiantes
supabase functions deploy listar-estudiantes
supabase functions deploy restablecer-password-estudiante
```

Las funciones que requieren acceso administrativo deben mantener sus secretos configurados únicamente en el entorno de Supabase.

## Publicación

La aplicación usa `HashRouter` y está configurada para publicarse en GitHub Pages en un repositorio llamado `SICE`. El build se genera en `dist/`; puedes publicarlo con:

```bash
pnpm deploy
```

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el entorno de compilación de producción. Revisa las políticas de acceso de Supabase antes de utilizar datos reales.

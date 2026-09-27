# SICE v3 — Instrucciones de arranque para Copilot

## Estructura del proyecto

```
SICE/
├── index.html
├── vite.config.js          ← base: '/SICE/'
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── public/
│   └── .nojekyll
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── auth.js
│   │   ├── data.js
│   │   └── rubricas.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   ├── Shell.jsx
│   │   ├── RubricaForm.jsx
│   │   └── ui/index.jsx
│   └── pages/
│       ├── Login.jsx
│       ├── profesor/
│       │   ├── Grupos.jsx
│       │   ├── Pendientes.jsx
│       │   ├── Calificar.jsx
│       │   └── Admin/
│       │       ├── index.jsx
│       │       ├── StepParalelo.jsx
│       │       ├── StepEstudiantes.jsx
│       │       └── StepGrupos.jsx
│       └── estudiante/
│           ├── MiGrupo.jsx
│           ├── Coevaluar.jsx
│           ├── CoevaluarForm.jsx
│           └── Notas.jsx
└── supabase/
    ├── schema.sql
    ├── seed_materias.sql
    ├── seed_rubricas.sql
    └── functions/
        └── crear-cuentas-estudiantes/
```

---

## Pasos de instalación

```bash
# 1. Instalar dependencias
pnpm install

# 2. Arrancar en desarrollo
pnpm dev

# 3. Build para producción
pnpm build

# 4. Desplegar en GitHub Pages (requiere gh-pages instalado)
pnpm deploy
```

---

## Decisiones de arquitectura que Copilot debe conocer

### Router
Se usa `HashRouter` (no `BrowserRouter`) porque GitHub Pages no soporta
rutas sin hash en SPAs. Todas las rutas funcionan con `/#/ruta`.

### Contexto entre páginas
El `Shell.jsx` carga el contexto activo (paralelo, hemisemestres) y lo pasa
a las páginas hijas a través de `<Outlet context={...} />`.
Las páginas lo consumen con `useOutletContext()`:

```jsx
const { contexto, hemisemestreActivo, hemisemestres, recargarContexto } = useOutletContext()
```

- `contexto` — `{ paraleloId, codigo, materiaNombre, periodoNombre, etiqueta, grupoId?, rolGrupo?, lider? }`
- `hemisemestreActivo` — `{ id, nombre, orden }` — el seleccionado en los tabs del sidebar
- `hemisemestres` — `[{ id, nombre, orden }]` — los 2 del paralelo activo
- `recargarContexto` — función para forzar recarga del sidebar (ej. tras crear un paralelo)

### Navegación con estado
Las páginas `Calificar` y `CoevaluarForm` reciben sus datos por
`useLocation().state` (pasado por `navigate('/ruta', { state: {...} })`).
Si el usuario navega directamente a la URL sin estado, se muestra un error.

### Esquema de BD (v3)
- `coordinador` → `lider` en `grupo_miembros`
- `hemisemestres` se crean automáticamente al insertar un `paralelo` (trigger)
- `configuracion_notas` (70/30) también se crea por trigger
- No existe tabla `etapas` ni columna `coordinador` — cualquier referencia a
  esos nombres es de versiones anteriores

### Tailwind
Los colores personalizados de SICE viven en `tailwind.config.js`:
- `sidebar` — fondo del sidebar (`#141410`)
- `gold`, `gold-dim`, `gold-soft` — dorado en 3 variantes
- `sice.green`, `sice.green-soft` — verde institucional
- `sice.red`, `sice.red-soft` — error/peligro
- `sice.amber`, `sice.amber-soft` — advertencia/pendiente
- `ink`, `ink-mid`, `ink-soft` — escala de tinta
- `surface` — fondo general

### Componentes UI
Todos los componentes reutilizables están en `src/components/ui/index.jsx`:
`Button`, `Badge`, `Panel`, `StatCard`, `Aviso`, `Eyebrow`, `Spinner`,
`Tabla`, `FilaTabla`, `CeldaTabla`, `Campo`, `Input`, `Select`, `Textarea`.

---

## Errores frecuentes y solución

| Error | Causa | Solución |
|---|---|---|
| Pantalla en blanco en GitHub Pages | `BrowserRouter` no soporta rutas directas | Usar `HashRouter` (ya configurado) |
| `useOutletContext` devuelve `null` | El componente no está dentro de `<Outlet>` | Verificar que la ruta esté dentro del `<Route>` que renderiza `Shell` |
| `column lider does not exist` | Schema v2 aplicado (tiene `coordinador`) | Aplicar schema v3 en Supabase Studio |
| Edge Function 404 | No desplegada en Supabase | `supabase functions deploy crear-cuentas-estudiantes` |
| Grupos no aparecen | `grupo_temas` no tiene fila para ese `hemisemestre_id` | El tema debe insertarse para ambos hemisemestres al crear el grupo (lo hace `crearGrupo` en `data.js`) |
| Redirect infinito a `/profesor/admin` | El profesor no tiene paralelos con `profesor_id` = su UUID | Verificar en Table Editor que `paralelos.profesor_id` esté bien asignado |

---

## Orden de ejecución de SQL en Supabase Studio

1. `supabase/schema.sql`
2. `supabase/seed_materias.sql`
3. `supabase/seed_rubricas.sql`

Ejecutar en ese orden, cada uno en una sola pasada en el SQL Editor.

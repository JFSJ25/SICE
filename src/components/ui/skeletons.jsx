import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// ============================================================
// Componentes Base y Utilitarios de Skeleton
// ============================================================

export function PageHeaderSkeleton({
  hasButton = true,
  hasEyebrow = true,
  titleWidth = 'min(18rem, 75%)',
  subtitleWidth = 'min(28rem, 90%)'
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
      <div className="space-y-2 flex-1 min-w-[240px]">
        {hasEyebrow && (
          <Skeleton width="7.5rem" height="0.8rem" borderRadius="4px" />
        )}
        <Skeleton width={titleWidth} height="2rem" borderRadius="6px" />
        <Skeleton width={subtitleWidth} height="0.875rem" borderRadius="4px" />
      </div>
      {hasButton && (
        <Skeleton width="6.5rem" height="2.25rem" borderRadius="6px" />
      )}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card px-4 py-3.5">
      <div className="mb-2">
        <Skeleton width="3rem" height="1.875rem" borderRadius="6px" />
      </div>
      <Skeleton width="65%" height="0.75rem" borderRadius="4px" />
    </div>
  )
}

export function StatCardsGridSkeleton({
  count = 4,
  columnsClass = 'grid-cols-2 md:grid-cols-4'
}) {
  return (
    <div className={`grid ${columnsClass} gap-3 mb-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ============================================================
// Skeletons Específicos por Pantalla
// ============================================================

/**
 * Skeleton para la pantalla del Profesor: Grupos y temas
 */
export function GruposSkeleton() {
  return (
    <div className="w-full space-y-6" aria-label="Cargando grupos y temas">
      <PageHeaderSkeleton hasButton hasEyebrow />
      <StatCardsGridSkeleton
        count={4}
        columnsClass="grid-cols-2 md:grid-cols-4"
      />

      {/* Barra de control y coevaluación */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface rounded-DEFAULT border border-black/10 dark:border-white/10 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton width="11rem" height="1rem" borderRadius="4px" />
          <Skeleton width="8.5rem" height="1.375rem" borderRadius="9999px" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width="7.5rem" height="2rem" borderRadius="6px" />
          <Skeleton width="8rem" height="2rem" borderRadius="6px" />
        </div>
      </div>

      {/* Grilla de tarjetas de grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 border border-black/[0.11] dark:border-white/10 rounded-DEFAULT shadow-card p-5"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <Skeleton width="4.5rem" height="0.875rem" borderRadius="4px" />
              <Skeleton width="9rem" height="1.5rem" borderRadius="9999px" />
            </div>
            <div className="mb-4 mt-1">
              <Skeleton width="85%" height="1.25rem" borderRadius="4px" />
            </div>
            <div className="divide-y divide-black/[0.07] dark:divide-white/10 pt-2 border-t border-black/[0.07] dark:border-white/10">
              {[1, 2, 3].map(row => (
                <div
                  key={row}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Skeleton circle width="1.75rem" height="1.75rem" />
                    <div className="space-y-1 flex-1">
                      <Skeleton
                        width="min(12rem, 70%)"
                        height="0.875rem"
                        borderRadius="4px"
                      />
                      <Skeleton
                        width="4.5rem"
                        height="0.65rem"
                        borderRadius="4px"
                      />
                    </div>
                  </div>
                  <Skeleton
                    width="4.75rem"
                    height="1.75rem"
                    borderRadius="6px"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton para tablas (como Pendientes de calificación)
 */
export function TableSkeleton({
  headers = ['Grupo', 'Estudiante', 'Rol', ''],
  rows = 6
}) {
  return (
    <div className="w-full space-y-6" aria-label="Cargando listado">
      <PageHeaderSkeleton hasButton={false} hasEyebrow />
      <div className="overflow-x-auto rounded-DEFAULT shadow-card border border-black/[0.07] dark:border-white/10">
        <table className="w-full text-sm bg-white dark:bg-slate-800 border-collapse">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="bg-slate-700 text-slate-100 dark:bg-slate-200 dark:text-slate-800 font-semibold text-sm tracking-wide px-4 py-3 text-left"
                >
                  {h || '\u00A0'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr
                key={i}
                className="border-b border-black/[0.07] dark:border-white/10 last:border-0"
              >
                <td className="px-4 py-3.5">
                  <Skeleton width="4.5rem" height="1rem" borderRadius="4px" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="space-y-1">
                    <Skeleton
                      width="11rem"
                      height="0.95rem"
                      borderRadius="4px"
                    />
                    <Skeleton width="7rem" height="0.7rem" borderRadius="4px" />
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Skeleton
                    width="5.5rem"
                    height="1.25rem"
                    borderRadius="9999px"
                  />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Skeleton width="4.75rem" height="2rem" borderRadius="6px" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Skeleton para la pantalla de Calificar con Rúbrica
 */
export function CalificarSkeleton() {
  return (
    <div
      className="w-full space-y-5"
      aria-label="Cargando rúbrica de calificación"
    >
      <Skeleton
        width="4.5rem"
        height="1.25rem"
        borderRadius="4px"
        className="mb-4"
      />
      <div className="mb-6 space-y-2">
        <Skeleton width="10rem" height="0.8rem" borderRadius="4px" />
        <Skeleton width="15rem" height="2.25rem" borderRadius="6px" />
        <Skeleton width="22rem" height="0.9rem" borderRadius="4px" />
      </div>

      <div className="bg-white dark:bg-slate-800 border border-black/[0.11] dark:border-white/10 rounded-DEFAULT shadow-card p-5 md:p-6 space-y-6">
        {[1, 2].map(cat => (
          <div key={cat} className="space-y-4">
            <div className="pb-2 border-b border-black/[0.08] dark:border-white/10 flex items-center justify-between">
              <Skeleton width="11rem" height="1.25rem" borderRadius="4px" />
              <Skeleton width="4rem" height="1rem" borderRadius="4px" />
            </div>
            <div className="space-y-3">
              {[1, 2].map(crit => (
                <div
                  key={crit}
                  className="p-3.5 bg-surface rounded-DEFAULT border border-black/[0.06] dark:border-white/10 space-y-3"
                >
                  <div>
                    <Skeleton width="50%" height="1rem" borderRadius="4px" />
                    <Skeleton
                      width="80%"
                      height="0.75rem"
                      borderRadius="4px"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(opt => (
                      <Skeleton key={opt} height="2.5rem" borderRadius="6px" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-black/[0.08] dark:border-white/10 space-y-2">
          <Skeleton width="13rem" height="1rem" borderRadius="4px" />
          <Skeleton height="5rem" borderRadius="6px" />
        </div>

        <div className="pt-4 border-t border-black/[0.08] dark:border-white/10 flex items-center justify-between gap-4">
          <Skeleton width="9rem" height="2.25rem" borderRadius="6px" />
          <Skeleton width="8.5rem" height="2.5rem" borderRadius="6px" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton para la pantalla Estudiante: Mi Grupo
 */
export function MiGrupoSkeleton() {
  return (
    <div
      className="w-full space-y-6"
      aria-label="Cargando información del grupo"
    >
      <PageHeaderSkeleton hasButton hasEyebrow />

      {/* Banner asignación actual */}
      <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-5">
        <Skeleton
          width="8rem"
          height="0.75rem"
          borderRadius="4px"
          className="mb-2"
        />
        <div className="flex items-center gap-2">
          <Skeleton width="5.5rem" height="1.25rem" borderRadius="4px" />
          <Skeleton width="5rem" height="1.25rem" borderRadius="9999px" />
          <Skeleton width="4rem" height="1.25rem" borderRadius="9999px" />
        </div>
      </div>

      {/* Grilla de selección de grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 border border-black/[0.11] dark:border-white/10 rounded-DEFAULT shadow-card p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton width="4.5rem" height="1rem" borderRadius="4px" />
              <Skeleton width="6.5rem" height="1.25rem" borderRadius="9999px" />
            </div>
            <Skeleton width="85%" height="1.25rem" borderRadius="4px" />
            <div className="space-y-2 p-3 bg-surface rounded-DEFAULT border border-black/[0.06] dark:border-white/10">
              <Skeleton width="40%" height="0.75rem" borderRadius="4px" />
              <Skeleton width="75%" height="0.75rem" borderRadius="4px" />
              <Skeleton width="60%" height="0.75rem" borderRadius="4px" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.07] dark:border-white/10">
              <Skeleton width="6rem" height="1.75rem" borderRadius="9999px" />
              <Skeleton width="7rem" height="2rem" borderRadius="6px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton para la pantalla Estudiante: Coevaluar
 */
export function CoevaluarSkeleton() {
  return (
    <div className="w-full space-y-6" aria-label="Cargando coevaluación">
      <PageHeaderSkeleton hasButton hasEyebrow />
      <StatCardsGridSkeleton
        count={3}
        columnsClass="grid-cols-1 sm:grid-cols-3"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 border border-black/[0.11] dark:border-white/10 rounded-DEFAULT shadow-card p-5 space-y-3"
          >
            <Skeleton width="4rem" height="0.875rem" borderRadius="4px" />
            <Skeleton width="90%" height="1.25rem" borderRadius="4px" />
            <Skeleton width="70%" height="0.8rem" borderRadius="4px" />
            <div className="flex justify-end pt-3 border-t border-black/[0.07] dark:border-white/10">
              <Skeleton width="7.5rem" height="2rem" borderRadius="6px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton para formulario de coevaluación
 */
export function CoevaluarFormSkeleton() {
  return (
    <div
      className="w-full space-y-5"
      aria-label="Cargando formulario de coevaluación"
    >
      <Skeleton
        width="4.5rem"
        height="1.25rem"
        borderRadius="4px"
        className="mb-4"
      />
      <div className="mb-6 space-y-2">
        <Skeleton width="10rem" height="0.8rem" borderRadius="4px" />
        <Skeleton width="20rem" height="2rem" borderRadius="6px" />
      </div>

      {[1, 2].map(miembro => (
        <div
          key={miembro}
          className="bg-white dark:bg-slate-800 border border-black/[0.11] dark:border-white/10 rounded-DEFAULT shadow-card p-5 md:p-6 mb-4 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.07] dark:border-white/10">
            <Skeleton width="12rem" height="1.25rem" borderRadius="4px" />
            <Skeleton width="5rem" height="1.25rem" borderRadius="9999px" />
          </div>
          <div className="space-y-3">
            {[1, 2].map(crit => (
              <div
                key={crit}
                className="p-3 bg-surface rounded-DEFAULT border border-black/[0.06] dark:border-white/10 space-y-2"
              >
                <Skeleton width="50%" height="1rem" borderRadius="4px" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {[1, 2, 3, 4].map(opt => (
                    <Skeleton key={opt} height="2.5rem" borderRadius="6px" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Skeleton width="10rem" height="2.5rem" borderRadius="6px" />
      </div>
    </div>
  )
}

/**
 * Skeleton para la pantalla Estudiante: Notas
 */
export function NotasSkeleton() {
  return (
    <div className="w-full space-y-6" aria-label="Cargando notas y promedios">
      <PageHeaderSkeleton hasButton hasEyebrow />

      {[1, 2].map(s => (
        <div
          key={s}
          className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-5 md:p-6 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/10">
            <Skeleton width="11rem" height="1.375rem" borderRadius="4px" />
            <Skeleton width="6rem" height="1.5rem" borderRadius="9999px" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(row => (
              <div key={row} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton
                    width="12rem"
                    height="0.875rem"
                    borderRadius="4px"
                  />
                  <Skeleton width="3rem" height="0.875rem" borderRadius="4px" />
                </div>
                <Skeleton height="0.625rem" borderRadius="9999px" />
              </div>
            ))}
          </div>
          <div className="p-4 bg-surface rounded-DEFAULT border border-black/[0.07] dark:border-white/10 space-y-2">
            <Skeleton width="8rem" height="0.875rem" borderRadius="4px" />
            <Skeleton width="90%" height="0.8rem" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton para la pantalla de Reportes
 */
export function ReportesSkeleton() {
  return (
    <div
      className="w-full space-y-6"
      aria-label="Cargando configuración de reportes"
    >
      <PageHeaderSkeleton hasButton={false} hasEyebrow />
      <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-5 md:p-6">
        <div className="flex flex-col gap-5 max-w-xl">
          <div className="space-y-1.5">
            <Skeleton width="12rem" height="1.25rem" borderRadius="4px" />
            <Skeleton width="90%" height="0.875rem" borderRadius="4px" />
          </div>
          <div className="space-y-2">
            <Skeleton width="7rem" height="0.8rem" borderRadius="4px" />
            <Skeleton height="2.5rem" borderRadius="6px" />
          </div>
          <Skeleton width="9.5rem" height="2.5rem" borderRadius="6px" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton para el directorio de estudiantes
 */
// export function EstudiantesSkeleton() {
//   return (
//     <div className="w-full space-y-6" aria-label="Cargando directorio de estudiantes">
//       <PageHeaderSkeleton hasButton={false} hasEyebrow />

//       {/* Buscador */}
//       <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-4 flex gap-3">
//         <Skeleton className="flex-1" height="2.5rem" borderRadius="6px" />
//         <Skeleton width="6rem" height="2.5rem" borderRadius="6px" />
//       </div>

//       {/* Panel de lista */}
//       <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card overflow-hidden">
//         <div className="px-5 py-4 border-b border-black/[0.07] dark:border-white/10 flex items-center justify-between">
//           <Skeleton width="8rem" height="1.25rem" borderRadius="4px" />
//           <Skeleton width="5rem" height="0.875rem" borderRadius="9999px" />
//         </div>
//         <div className="divide-y divide-black/[0.07] dark:divide-white/10">
//           {[1, 2, 3, 4, 5].map(i => (
//             <div
//               key={i}
//               className="px-5 py-4 flex items-center justify-between gap-4"
//             >
//               <div className="flex items-center gap-3">
//                 <Skeleton circle width="2rem" height="2rem" />
//                 <div className="space-y-1">
//                   <Skeleton width="11rem" height="0.95rem" borderRadius="4px" />
//                   <Skeleton width="8rem" height="0.75rem" borderRadius="4px" />
//                 </div>
//               </div>
//               <Skeleton width="6.5rem" height="2rem" borderRadius="6px" />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }

/**
 * Skeleton para los pasos de Administración
 */
export function AdminStepSkeleton() {
  return (
    <div className="w-full space-y-4" aria-label="Cargando administración">
      <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-5">
        <Skeleton
          width="10rem"
          height="0.875rem"
          borderRadius="4px"
          className="mb-2"
        />
        <Skeleton height="2.5rem" borderRadius="6px" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-5 md:p-6 space-y-4">
        <Skeleton width="14rem" height="1.25rem" borderRadius="4px" />
        <Skeleton height="3.5rem" borderRadius="6px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Skeleton height="5rem" borderRadius="8px" />
          <Skeleton height="5rem" borderRadius="8px" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton para pantallas de autenticación y carga de sesión
 */
export function AuthSkeleton() {
  return (
    <div
      className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-6 md:p-8 space-y-4 text-center max-w-md mx-auto"
      aria-label="Verificando sesión"
    >
      <div className="flex justify-center mb-1">
        <Skeleton circle width="3.25rem" height="3.25rem" />
      </div>
      <Skeleton
        width="12rem"
        height="1.5rem"
        borderRadius="6px"
        className="mx-auto"
      />
      <Skeleton
        width="16rem"
        height="0.875rem"
        borderRadius="4px"
        className="mx-auto"
      />
      <div className="pt-3 flex justify-center">
        <Skeleton width="7rem" height="1.75rem" borderRadius="9999px" />
      </div>
    </div>
  )
}

/**
 * Skeleton balanceado general para páginas
 */
export function GeneralPageSkeleton() {
  return (
    <div className="w-full space-y-6" aria-label="Cargando contenido">
      <PageHeaderSkeleton hasButton hasEyebrow />
      <StatCardsGridSkeleton
        count={4}
        columnsClass="grid-cols-2 md:grid-cols-4"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-5 space-y-3">
          <Skeleton width="40%" height="1.25rem" borderRadius="4px" />
          <Skeleton width="80%" height="0.875rem" borderRadius="4px" />
          <Skeleton count={3} height="1rem" className="mt-2" />
        </div>
        <div className="bg-white dark:bg-slate-800 border border-blue-900/[0.09] dark:border-white/10 rounded-DEFAULT shadow-card p-5 space-y-3">
          <Skeleton width="40%" height="1.25rem" borderRadius="4px" />
          <Skeleton width="80%" height="0.875rem" borderRadius="4px" />
          <Skeleton count={3} height="1rem" className="mt-2" />
        </div>
      </div>
    </div>
  )
}

/**
 * Componente unificado LoadingSkeleton con soporte de variantes y retrocompatibilidad total.
 */
export function LoadingSkeleton({ variant = 'page', ...props }) {
  switch (variant) {
    case 'grupos':
      return <GruposSkeleton {...props} />
    case 'table':
    case 'pendientes':
      return <TableSkeleton {...props} />
    case 'calificar':
    case 'rubrica':
      return <CalificarSkeleton {...props} />
    case 'mi-grupo':
      return <MiGrupoSkeleton {...props} />
    case 'coevaluar':
      return <CoevaluarSkeleton {...props} />
    case 'coevaluar-form':
      return <CoevaluarFormSkeleton {...props} />
    case 'notas':
      return <NotasSkeleton {...props} />
    case 'reportes':
      return <ReportesSkeleton {...props} />
    case 'estudiantes':
    case 'list':
      return <EstudiantesSkeleton {...props} />
    case 'admin':
    case 'admin-grupos':
    case 'admin-paralelo':
      return <AdminStepSkeleton {...props} />
    case 'auth':
      return <AuthSkeleton {...props} />
    case 'page':
    default:
      return <GeneralPageSkeleton {...props} />
  }
}

// ============================================================
// Componentes UI reutilizables de SICE
// ============================================================

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-sm transition-all active:translate-y-px disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap'
  const variants = {
    primary:
      'bg-gold text-white border border-blue-700/20 shadow-sm hover:bg-blue-700 hover:shadow-md',
    outline:
      'bg-transparent border border-ink/20 text-ink hover:border-gold/60 hover:bg-gold-soft/40',
    ghost:
      'bg-transparent border-transparent text-ink-mid hover:bg-gold-soft/60 hover:text-ink',
    danger: 'bg-sice-red text-white border border-black/5 hover:brightness-110'
  }
  const sizes = {
    sm: 'text-xs px-3 py-1.5 tracking-wide',
    md: 'text-sm px-4 py-2.5 tracking-tight',
    lg: 'text-base px-5 py-3'
  }
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ children, variant = 'ok' }) {
  const variants = {
    ok: 'bg-sice-green-soft text-sice-green',
    pending: 'bg-sice-amber-soft text-sice-amber',
    info: 'bg-gold-soft text-gold'
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

export function Panel({ children, className = '' }) {
  return (
    <div
      className={`bg-white border border-blue-900/[0.09] rounded-DEFAULT shadow-card p-5 md:p-6 mb-4 interactive-lift ${className}`}
    >
      {children}
    </div>
  )
}

export function StatCard({ value, label, acento = 'gold' }) {
  const colores = {
    gold: 'text-gold',
    green: 'text-sice-green',
    red: 'text-sice-red'
  }
  return (
    <div className="bg-white border border-blue-900/[0.09] rounded-DEFAULT shadow-card px-4 py-3.5 interactive-lift">
      <div
        className={`font-display text-3xl font-bold leading-none mb-1.5 ${colores[acento]}`}
      >
        {value}
      </div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  )
}

export function Aviso({ children, variant = 'amber' }) {
  const variants = {
    amber: 'bg-sice-amber-soft border-sice-amber/20 text-sice-amber',
    green: 'bg-sice-green-soft border-sice-green/20 text-sice-green',
    red: 'bg-sice-red-soft   border-sice-red/20   text-sice-red'
  }
  return (
    <div
      className={`border flex items-center rounded-sm px-4 py-3 text-sm leading-relaxed mb-4 ${variants[variant]}`}
    >
      <span>{children}</span>
    </div>
  )
}

export function Eyebrow({ children }) {
  return (
    <p className="text-xs font-semibold text-sice-green mb-1.5 tracking-wide">
      {children}
    </p>
  )
}

export function Spinner({ className = '' }) {
  return (
    <div
      className={`inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
    />
  )
}

export function Tabla({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-DEFAULT shadow-card">
      <table className="w-full text-sm bg-white border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th
                key={h}
                className="bg-sidebar text-white/70 font-semibold text-xs tracking-wide px-4 py-3 text-left"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function FilaTabla({ children, className = '' }) {
  return (
    <tr
      className={`border-b border-black/[0.07] last:border-0 hover:bg-surface ${className}`}
    >
      {children}
    </tr>
  )
}

export function CeldaTabla({ children, className = '' }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}

// Input y Select con estilo consistente
export function Campo({ label, hint, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-ink-mid">{label}</label>
      )}
      {children}
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      {error && <p className="text-xs text-sice-red">{error}</p>}
    </div>
  )
}

const inputBase =
  'w-full px-3 py-2.5 border border-ink/20 rounded-sm text-sm bg-white text-ink transition focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/15'

export function Input({ className = '', ...props }) {
  return <input className={`${inputBase} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputBase} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`${inputBase} resize-y min-h-[80px] leading-relaxed ${className}`}
      {...props}
    />
  )
}

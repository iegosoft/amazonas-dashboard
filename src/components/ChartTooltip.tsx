import type { ReactNode } from 'react'

/** Caixa de dica que acompanha o ponteiro dentro de um gráfico (o pai precisa ser `relative`). */
export function ChartTooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const w = 232
  const left = Math.max(4, Math.min(x + 16, width - w - 4))
  const below = y < 120
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute z-20 rounded-2xl border border-night-900/10 bg-white/95 p-3 text-xs shadow-xl shadow-night-900/10 backdrop-blur-md dark:border-white/10 dark:bg-night-800/95"
      style={{ left, top: below ? y + 18 : y - 14, width: w, transform: below ? undefined : 'translateY(-100%)' }}
    >
      {children}
    </div>
  )
}

/** Linha "rótulo ........ valor" dentro da dica. */
export function TipRow({ label, value, swatch }: { label: string; value: ReactNode; swatch?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="flex items-center gap-1.5 muted">
        {swatch && <span className="h-2 w-2 rounded-[3px]" style={{ background: swatch }} />}
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

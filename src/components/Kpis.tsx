import type { ComponentType, ReactNode } from 'react'
import { useCountUp } from '../hooks'
import { fmtBRLCompact, fmtInt, fmtPct } from '../lib/format'
import { sum } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'
import { CoinsIcon, LandmarkIcon, MapIcon, UsersIcon } from './Icons'

interface Item {
  label: string
  value: number
  format: (v: number) => string
  hint: ReactNode
  Icon: ComponentType<{ className?: string }>
  tone: string
  extra?: ReactNode
}

export function Kpis({ municipios, periods }: { municipios: Municipio[]; periods: Periods }) {
  const popTotal = sum(municipios.map((m) => m.popEst))
  const pibTotal = sum(municipios.map((m) => m.pib)) * 1000
  const biggestPib = [...municipios].sort((a, b) => (b.pib ?? 0) - (a.pib ?? 0))[0]
  const biggestPop = [...municipios].sort((a, b) => (b.popEst ?? 0) - (a.popEst ?? 0))[0]
  const shareCap = biggestPib?.pib ? (biggestPib.pib * 1000 * 100) / (pibTotal || 1) : 0
  const shareCapPop = biggestPop?.popEst ? (biggestPop.popEst * 100) / (popTotal || 1) : 0

  const items: Item[] = [
    {
      label: 'Municípios',
      value: municipios.length,
      format: (v) => fmtInt(Math.round(v)),
      hint: 'no estado',
      Icon: MapIcon,
      tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    },
    {
      label: 'População estimada',
      value: popTotal,
      format: (v) => fmtInt(Math.round(v)),
      hint: `estimativa ${periods.pop}`,
      Icon: UsersIcon,
      tone: 'bg-forest-500/10 text-forest-700 dark:text-forest-300',
    },
    {
      label: 'PIB do estado',
      value: pibTotal,
      format: fmtBRLCompact,
      hint: `soma dos municípios · ${periods.pib}`,
      Icon: CoinsIcon,
      tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    {
      label: `Peso de ${biggestPib?.nome ?? '—'}`,
      value: shareCap,
      format: (v) => `${fmtPct(v)} do PIB`,
      hint: `PIB de ${periods.pib} · ${fmtPct(shareCapPop)} da população em ${periods.pop}`,
      Icon: LandmarkIcon,
      tone: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
      extra: (
        <div className="mt-3 space-y-1.5" aria-hidden>
          <Bar pct={shareCap} className="bg-fuchsia-500" label="PIB" />
          <Bar pct={shareCapPop} className="bg-fuchsia-300 dark:bg-fuchsia-400/60" label="Pop." />
        </div>
      ),
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((k, i) => (
        <div
          key={k.label}
          className="card animate-rise relative flex flex-col p-4 sm:p-5"
          style={{ animationDelay: `${80 + i * 70}ms` }}
        >
          <div className="flex items-start justify-between gap-2">
            <dt className="text-xs font-medium muted sm:text-[13px]">{k.label}</dt>
            <span className={`hidden h-8 w-8 shrink-0 place-items-center rounded-xl sm:grid ${k.tone}`}>
              <k.Icon className="h-4 w-4" />
            </span>
          </div>
          <dd className="mt-1.5 font-display text-2xl font-semibold tracking-tight tabular-nums sm:text-[2rem] sm:leading-tight">
            <Counter value={k.value} format={k.format} />
          </dd>
          <dd className="mt-0.5 text-xs muted">{k.hint}</dd>
          {k.extra && <dd className="mt-auto">{k.extra}</dd>}
        </div>
      ))}
    </dl>
  )
}

function Counter({ value, format }: { value: number; format: (v: number) => string }) {
  const v = useCountUp(value)
  return (
    <>
      <span aria-hidden>{format(v)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  )
}

function Bar({ pct, className, label }: { pct: number; className: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-medium muted">
      <span className="w-7">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-night-900/[0.06] dark:bg-white/10">
        <span className={`block h-full rounded-full ${className}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
    </div>
  )
}

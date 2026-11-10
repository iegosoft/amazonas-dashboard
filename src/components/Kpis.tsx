import { fmtBRLCompact, fmtInt, fmtPct } from '../lib/format'
import { sum } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'

export function Kpis({ municipios, periods }: { municipios: Municipio[]; periods: Periods }) {
  const popTotal = sum(municipios.map((m) => m.popEst))
  const pibTotal = sum(municipios.map((m) => m.pib)) * 1000
  const biggestPib = [...municipios].sort((a, b) => (b.pib ?? 0) - (a.pib ?? 0))[0]
  const biggestPop = [...municipios].sort((a, b) => (b.popEst ?? 0) - (a.popEst ?? 0))[0]
  const shareCap = biggestPib?.pib ? (biggestPib.pib * 1000 * 100) / (pibTotal || 1) : 0
  const shareCapPop = biggestPop?.popEst ? (biggestPop.popEst * 100) / (popTotal || 1) : 0

  const items = [
    { label: 'Municípios', value: String(municipios.length), hint: 'no estado', color: 'border-t-sky-500' },
    { label: 'População estimada', value: fmtInt(popTotal), hint: `estimativa ${periods.pop}`, color: 'border-t-emerald-500' },
    { label: 'PIB do estado', value: fmtBRLCompact(pibTotal), hint: `soma dos municípios · ${periods.pib}`, color: 'border-t-orange-500' },
    {
      label: `Peso de ${biggestPib?.nome ?? '—'}`,
      value: `${fmtPct(shareCap)} do PIB`,
      hint: `PIB de ${periods.pib} · ${fmtPct(shareCapPop)} da população em ${periods.pop}`,
      color: 'border-t-fuchsia-600',
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className={`rounded-xl border border-t-4 border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 ${k.color}`}>
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{k.label}</dt>
          <dd className="mt-0.5 text-xl font-bold tabular-nums sm:text-2xl">{k.value}</dd>
          <dd className="text-xs text-slate-500 dark:text-slate-400">{k.hint}</dd>
        </div>
      ))}
    </dl>
  )
}

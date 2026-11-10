import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Kpis } from './components/Kpis'
import { Legend, MapView } from './components/MapView'
import { Ranking } from './components/Ranking'
import { useDataset, useTheme } from './hooks'
import { INDICATORS, INDICATOR_BY_KEY, isIndicatorKey, type IndicatorKey } from './lib/indicators'
import { classify, rankBy } from './lib/stats'
import type { Dataset } from './lib/types'

const Detail = lazy(() => import('./components/Detail').then((m) => ({ default: m.Detail })))

const ITACOATIARA = '1301902'

function readUrl() {
  const p = new URLSearchParams(window.location.search)
  const i = p.get('i')
  return {
    indicator: isIndicatorKey(i) ? i : ('popEst' as IndicatorKey),
    selected: p.get('m') ?? ITACOATIARA,
    compare: p.get('c'),
  }
}

export default function App() {
  const [state, retry] = useDataset()
  const [dark, toggleTheme] = useTheme()

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Painel de dados abertos</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Amazonas em números</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Explore população, economia e perfil produtivo dos 62 municípios do estado. Clique no mapa, compare cidades e veja onde cada uma se destaca.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
          className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          {dark ? '☀️ Claro' : '🌙 Escuro'}
        </button>
      </header>

      {state.status === 'loading' && <Skeleton />}
      {state.status === 'error' && (
        <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/40">
          <h2 className="font-semibold text-rose-800 dark:text-rose-200">Não foi possível carregar os dados</h2>
          <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{state.message}</p>
          <button type="button" onClick={retry} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            Tentar de novo
          </button>
        </div>
      )}
      {state.status === 'ready' && <Dashboard data={state.data} />}

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Fonte: IBGE — Estimativas de População, Censo Demográfico 2022, PIB dos Municípios e Malhas Territoriais, via API de dados agregados. PIB per capita = PIB ÷ população do Censo 2022.
      </footer>
    </div>
  )
}

function Dashboard({ data }: { data: Dataset }) {
  const [initial] = useState(readUrl)
  const [indicatorKey, setIndicatorKey] = useState<IndicatorKey>(initial.indicator)
  const [selectedId, setSelectedId] = useState(initial.selected)
  const [compareId, setCompareId] = useState<string | null>(initial.compare)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const byId = useMemo(() => new Map(data.municipios.map((m) => [m.id, m])), [data])
  const indicator = INDICATOR_BY_KEY[indicatorKey]
  const ranking = useMemo(() => rankBy(data.municipios, indicator), [data, indicator])
  const rankOf = useMemo(() => new Map(ranking.map((r) => [r.m.id, r.rank])), [ranking])
  const classes = useMemo(() => classify(ranking.map((r) => r.value), indicator.interpolator), [ranking, indicator])

  const safeSelected = byId.has(selectedId) ? selectedId : ITACOATIARA
  const selected = byId.get(safeSelected) ?? data.municipios[0]!
  const compare = compareId && compareId !== selected.id ? (byId.get(compareId) ?? null) : null

  useEffect(() => {
    const p = new URLSearchParams()
    p.set('i', indicatorKey)
    p.set('m', selected.id)
    if (compare) p.set('c', compare.id)
    window.history.replaceState(null, '', `?${p.toString()}`)
  }, [indicatorKey, selected.id, compare])

  const top = ranking[0]
  const bottom = ranking[ranking.length - 1]
  const groups = [...new Set(INDICATORS.map((i) => i.group))]

  return (
    <main className="space-y-5">
      <Kpis municipios={data.municipios} periods={data.periods} />

      <nav aria-label="Escolha o indicador" className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-3">
          {groups.map((g) => (
            <div key={g}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{g}</p>
              <div className="flex flex-wrap gap-1.5">
                {INDICATORS.filter((i) => i.group === g).map((i) => (
                  <button
                    key={i.key}
                    type="button"
                    aria-pressed={i.key === indicatorKey}
                    onClick={() => setIndicatorKey(i.key)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                      i.key === indicatorKey
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2">
            <h2 className="text-lg font-bold">{indicator.label}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{indicator.description}</p>
          </div>
          <MapView
            geo={data.geo}
            byId={byId}
            indicator={indicator}
            classes={classes}
            rankOf={rankOf}
            total={ranking.length}
            selectedId={selected.id}
            compareId={compare?.id ?? null}
            hoveredId={hoveredId}
            onSelect={(id) => setSelectedId(id)}
            onHover={setHoveredId}
          />
          <div className="mt-3">
            <Legend indicator={indicator} classes={classes} />
          </div>
          {top && bottom && (
            <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <strong>{top.m.nome}</strong> lidera com {indicator.format(top.value)}; <strong>{bottom.m.nome}</strong> fica na ponta oposta, com {indicator.format(bottom.value)}.
            </p>
          )}
        </section>

        <div className="space-y-5 lg:col-span-5">
          <Suspense fallback={<div className="h-[34rem] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />}>
            <Detail
              municipios={data.municipios}
              selected={selected}
              compare={compare}
              periods={data.periods}
              onCompareChange={setCompareId}
            />
          </Suspense>
        </div>
      </div>

      <Ranking
        indicator={indicator}
        ranking={ranking}
        selectedId={selected.id}
        hoveredId={hoveredId}
        onSelect={setSelectedId}
        onHover={setHoveredId}
      />
    </main>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Carregando dados">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="h-[34rem] rounded-2xl bg-slate-200 lg:col-span-7 dark:bg-slate-800" />
        <div className="h-[34rem] rounded-2xl bg-slate-200 lg:col-span-5 dark:bg-slate-800" />
      </div>
    </div>
  )
}

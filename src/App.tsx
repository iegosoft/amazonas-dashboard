import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { About } from './components/About'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Kpis } from './components/Kpis'
import { Legend, MapView } from './components/MapView'
import { Ranking } from './components/Ranking'
import { ShareButton } from './components/ShareButton'
import { SourceNote } from './components/SourceNote'
import { useDataset, useTheme } from './hooks'
import { INDICATORS, INDICATOR_BY_KEY, isIndicatorKey, SOURCES, type IndicatorKey } from './lib/indicators'
import { classify, rankBy } from './lib/stats'
import { downloadText, municipiosCsv, rankingCsv } from './lib/csv'
import { fmtDate } from './lib/format'
import type { PublishedDataset } from './lib/types'

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
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Painel de dados abertos</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Amazonas em números</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Explore população, economia e perfil produtivo dos 62 municípios do estado. Clique no mapa, compare cidades e veja onde cada uma se destaca.
          </p>
          {state.status === 'ready' && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Dados do IBGE atualizados em {fmtDate(state.data.fetchedAt)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href="#sobre"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Sobre os dados
          </a>
          <ShareButton />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            {dark ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </div>
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
      {state.status === 'ready' && (
        <ErrorBoundary label="o painel">
          <Dashboard data={state.data} />
        </ErrorBoundary>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p>
          Fonte: IBGE —{' '}
          {Object.values(SOURCES).map((s, i) => (
            <span key={s.url}>
              {i > 0 && ', '}
              <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-slate-700 dark:hover:text-slate-200">
                {s.label}
              </a>
            </span>
          ))}{' '}
          e Malhas Territoriais. Os dados são coletados e validados automaticamente toda semana.
        </p>
        {state.status === 'ready' && (
          <p className="mt-1">
            Anos de referência: população estimada {state.data.periods.pop} · Censo {state.data.periods.censo} · PIB{' '}
            {state.data.periods.pib} · PIB por setor {state.data.periods.va}. Última atualização: {fmtDate(state.data.fetchedAt)}.
          </p>
        )}
      </footer>
    </div>
  )
}

function Dashboard({ data }: { data: PublishedDataset }) {
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
    // Mantém o #âncora (ex.: #sobre-pibPerCapita) para links compartilhados continuarem funcionando.
    window.history.replaceState(null, '', `?${p.toString()}${window.location.hash}`)
  }, [indicatorKey, selected.id, compare])

  // O navegador tenta ir até o #âncora antes de os dados carregarem; refaz quando o painel aparece.
  useEffect(() => {
    const target = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
    if (target) target.scrollIntoView()
  }, [])

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
            <div className="mt-1.5">
              <SourceNote indicator={indicator} periods={data.periods} />
            </div>
          </div>
          <ErrorBoundary label="o mapa">
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
          </ErrorBoundary>
          {top && bottom && (
            <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
              <strong>{top.m.nome}</strong> lidera com {indicator.format(top.value)}; <strong>{bottom.m.nome}</strong> fica na ponta oposta, com {indicator.format(bottom.value)}.
            </p>
          )}
        </section>

        <div className="space-y-5 lg:col-span-5">
          <ErrorBoundary label="os detalhes do município">
            <Suspense fallback={<div className="h-[34rem] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />}>
              <Detail
                municipios={data.municipios}
                selected={selected}
                compare={compare}
                periods={data.periods}
                onCompareChange={setCompareId}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      <ErrorBoundary label="o ranking">
        <Ranking
          indicator={indicator}
          period={indicator.period(data.periods)}
          ranking={ranking}
          selectedId={selected.id}
          hoveredId={hoveredId}
          onSelect={setSelectedId}
          onHover={setHoveredId}
          onDownload={() =>
            downloadText(
              `amazonas-ranking-${indicator.key}-${indicator.period(data.periods)}.csv`,
              rankingCsv(indicator, ranking, data.periods, data.fetchedAt),
            )
          }
        />
      </ErrorBoundary>

      <ErrorBoundary label="a seção Sobre os dados">
        <About
          periods={data.periods}
          fetchedAt={data.fetchedAt}
          onDownloadAll={() =>
            downloadText('amazonas-municipios.csv', municipiosCsv(data.municipios, data.periods, data.fetchedAt))
          }
        />
      </ErrorBoundary>
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

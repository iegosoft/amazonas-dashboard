import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { About } from './components/About'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Hero, SectionHeader } from './components/Hero'
import { ArrowRightIcon, CoinsIcon, Logo, MoonIcon, PieIcon, PinIcon, SparkIcon, SunIcon, UsersIcon } from './components/Icons'
import { Kpis } from './components/Kpis'
import { LazyMount } from './components/LazyMount'
import { Legend, MapView } from './components/MapView'
import { Panorama } from './components/Panorama'
import { Ranking } from './components/Ranking'
import { MunicipioSearch } from './components/Search'
import { ShareButton } from './components/ShareButton'
import { SourceNote } from './components/SourceNote'
import { useDataset, useInView, useScrolled, useScrollSpy, useTheme } from './hooks'
import { INDICATORS, INDICATOR_BY_KEY, isIndicatorKey, SOURCES, type Indicator, type IndicatorKey } from './lib/indicators'
import { classify, rankBy } from './lib/stats'
import { downloadText, municipiosCsv, rankingCsv } from './lib/csv'
import { fmtDate } from './lib/format'
import type { PublishedDataset } from './lib/types'

const Detail = lazy(() => import('./components/Detail').then((m) => ({ default: m.Detail })))
const Concentration = lazy(() => import('./components/Concentration').then((m) => ({ default: m.Concentration })))
const Scatter = lazy(() => import('./components/Scatter').then((m) => ({ default: m.Scatter })))
const SectorProfile = lazy(() => import('./components/SectorProfile').then((m) => ({ default: m.SectorProfile })))

/** Gráfico carregado sob demanda, com um bloco de espera do mesmo tamanho. */
function Deferred({ label, minHeight, children }: { label: string; minHeight: number; children: ReactNode }) {
  const fallback = <div aria-busy="true" className="card animate-pulse" style={{ minHeight }} />
  return (
    <ErrorBoundary label={label}>
      <LazyMount label={label} minHeight={minHeight}>
        <Suspense fallback={fallback}>{children}</Suspense>
      </LazyMount>
    </ErrorBoundary>
  )
}

const ITACOATIARA = '1301902'
const REPO = 'https://github.com/iegosoft/amazonas-dashboard'

const SECTIONS = [
  { id: 'visao-geral', label: 'Visão geral' },
  { id: 'mapa', label: 'Mapa' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'economia', label: 'Economia' },
  { id: 'sobre', label: 'Sobre os dados' },
]

const GROUP_ICON = { Pessoas: UsersIcon, Economia: CoinsIcon, 'Perfil econômico': PieIcon } as const

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
  const scrolled = useScrolled(24)
  const ready = state.status === 'ready'
  const active = useScrollSpy(
    SECTIONS.map((s) => s.id),
    ready,
  )

  const headerBtn = `btn px-3 py-1.5 ${
    scrolled
      ? 'text-night-900/75 hover:bg-night-900/[0.06] hover:text-night-900 dark:text-sand-100/75 dark:hover:bg-white/[0.08] dark:hover:text-white'
      : 'text-white/80 hover:bg-white/10 hover:text-white'
  }`
  const activeBtn = scrolled ? '!bg-forest-900 !text-white dark:!bg-forest-300 dark:!text-forest-950' : '!bg-white/15 !text-white'

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-full bg-white px-4 py-2 text-sm font-medium text-night-900 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled
            ? 'border-b border-night-900/[0.06] bg-sand-50/85 shadow-sm shadow-night-900/[0.03] backdrop-blur-xl dark:border-white/[0.06] dark:bg-night-950/85'
            : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-3 px-4 sm:px-6">
          <a href="#top" className={`flex shrink-0 items-center gap-2.5 ${scrolled ? 'text-night-900 dark:text-white' : 'text-white'}`}>
            <Logo className="h-8 w-8" />
            <span className="font-display text-[17px] font-bold tracking-tight">
              Amazonas <span className="font-medium opacity-60">em números</span>
            </span>
          </a>
          <nav aria-label="Seções" className="flex items-center gap-0.5">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? 'location' : undefined}
                className={`${headerBtn} max-lg:hidden ${active === s.id ? activeBtn : ''}`}
              >
                {s.label}
              </a>
            ))}
            <span className={`mx-1.5 h-5 w-px max-lg:hidden ${scrolled ? 'bg-night-900/10 dark:bg-white/10' : 'bg-white/20'}`} />
            <ShareButton className={headerBtn} />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
              title={dark ? 'Tema claro' : 'Tema escuro'}
              className={`${headerBtn} h-9 w-9 px-0`}
            >
              {dark ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
            </button>
          </nav>
        </div>
        {/* Menu de seções no celular e tablet: rola na horizontal */}
        {scrolled && ready && (
          <nav aria-label="Seções (atalho)" className="scroll-thin flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  active === s.id
                    ? 'bg-forest-900 text-white dark:bg-forest-300 dark:text-forest-950'
                    : 'bg-night-900/[0.05] text-night-900/70 dark:bg-white/[0.07] dark:text-sand-100/70'
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {state.status === 'ready' ? (
        <ErrorBoundary label="o painel">
          <Dashboard data={state.data} />
        </ErrorBoundary>
      ) : (
        <>
          <Hero geo={null} />
          <div id="conteudo" className="relative z-10 mx-auto -mt-24 w-full max-w-[100rem] flex-1 px-4 sm:-mt-28 sm:px-6">
            {state.status === 'loading' && <Skeleton />}
            {state.status === 'error' && (
              <div role="alert" className="card border-rose-300 p-6 dark:border-rose-900">
                <h2 className="font-display text-xl font-semibold text-rose-800 dark:text-rose-200">Não foi possível carregar os dados</h2>
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{state.message}</p>
                <button type="button" onClick={retry} className="btn mt-4 bg-rose-600 font-semibold text-white hover:bg-rose-700">
                  Tentar de novo
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <footer className="mt-24 bg-forest-950 text-white/65">
        <div className="mx-auto grid max-w-[100rem] gap-8 px-4 py-12 text-sm sm:px-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <Logo className="h-8 w-8" />
              <span className="font-display text-lg font-bold">
                Amazonas <span className="font-medium opacity-60">em números</span>
              </span>
            </div>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed">
              Fonte: IBGE —{' '}
              {Object.values(SOURCES).map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ', '}
                  <a href={s.url} target="_blank" rel="noreferrer" className="link text-white/80 hover:text-white">
                    {s.label}
                  </a>
                </span>
              ))}{' '}
              e Malhas Territoriais. Os dados são coletados e validados automaticamente toda semana.
            </p>
          </div>
          <div className="text-[13px] md:text-right">
            {state.status === 'ready' && (
              <p className="leading-relaxed">
                Anos de referência: população estimada {state.data.periods.pop} · Censo {state.data.periods.censo} · PIB{' '}
                {state.data.periods.pib} · PIB por setor {state.data.periods.va}. Última atualização: {fmtDate(state.data.fetchedAt)}.
              </p>
            )}
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 md:justify-end">
              <a href="#sobre" className="link text-white/80 hover:text-white">
                Sobre os dados
              </a>
              <a href={REPO} target="_blank" rel="noreferrer" className="link text-white/80 hover:text-white">
                Código aberto (MIT)
              </a>
            </p>
          </div>
        </div>
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
  /** Seleção feita longe do perfil: mostra o atalho flutuante "Ver perfil". */
  const [pickedFar, setPickedFar] = useState(false)
  const [perfilRef, perfilInView] = useInView<HTMLDivElement>()

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

  // O atalho some sozinho depois de alguns segundos.
  useEffect(() => {
    if (!pickedFar) return
    const t = setTimeout(() => setPickedFar(false), 7000)
    return () => clearTimeout(t)
  }, [pickedFar, selected.id])

  const pickFar = (id: string) => {
    setSelectedId(id)
    setPickedFar(true)
  }
  const goToProfile = () => {
    setPickedFar(false)
    document.getElementById('perfil')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const pickAndGo = (id: string) => {
    setSelectedId(id)
    goToProfile()
  }

  const top = ranking[0]
  const bottom = ranking[ranking.length - 1]
  const ratio = top && bottom && bottom.value > 0 ? top.value / bottom.value : null
  // Sugestões rápidas: Manaus, Parintins, Tefé e Tabatinga
  const quick = ['1302603', '1303403', '1304203', '1304062'].map((id) => byId.get(id)).filter((m) => m != null)

  return (
    <>
      <Hero
        geo={data.geo}
        fetchedAt={data.fetchedAt}
        search={<MunicipioSearch municipios={data.municipios} onPick={pickAndGo} />}
        quickPicks={
          quick.length > 0 && (
            <>
              <span>Experimente:</span>
              {quick.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pickAndGo(m.id)}
                  className="rounded-full border border-white/15 px-2.5 py-0.5 text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  {m.nome}
                </button>
              ))}
            </>
          )
        }
      />

      <main id="conteudo" className="relative z-10 mx-auto -mt-24 w-full max-w-[100rem] flex-1 space-y-8 px-4 sm:-mt-28 sm:px-6">
        {/* 01 · Visão geral */}
        <section id="visao-geral" aria-label="Visão geral" className="scroll-mt-28 space-y-6">
          <Kpis municipios={data.municipios} periods={data.periods} />
          <SectionHeader id="visao-geral" n="01" hint="Visão geral" title="Onde vivem as pessoas e onde está a riqueza" />
          <Deferred label="o gráfico de concentração" minHeight={560}>
            <Concentration
              municipios={data.municipios}
              periods={data.periods}
              selectedId={selected.id}
              hoveredId={hoveredId}
              onSelect={pickFar}
              onHover={setHoveredId}
            />
          </Deferred>
        </section>

        {/* 02 e 03 · Mapa e ranking: o seletor de indicador fica preso ao topo enquanto estão na tela */}
        <div className="space-y-6">
          <section id="mapa" aria-labelledby="mapa-titulo" className="scroll-mt-28 space-y-6">
            <SectionHeader id="mapa" n="02" hint="Explore o mapa" title="Escolha um indicador e clique num município">
              <p className="flex items-center gap-2 text-sm muted">
                <SparkIcon className="h-4 w-4 text-forest-600 dark:text-forest-300" />
                Passe o mouse para ver valores; clique para abrir o perfil.
              </p>
            </SectionHeader>
            <IndicatorPicker value={indicatorKey} onChange={setIndicatorKey} />

            <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
              <div className="card animate-rise self-start p-5 sm:p-6 lg:col-span-7">
                <div className="mb-3">
                  <p className="eyebrow">{indicator.group}</p>
                  <h3 id="mapa-titulo" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-[1.65rem]">
                    {indicator.label}
                  </h3>
                  <p className="mt-1 text-sm muted">{indicator.description}</p>
                  <div className="mt-3">
                    <SourceNote indicator={indicator} periods={data.periods} />
                  </div>
                </div>
                <ErrorBoundary label="o mapa">
                  <div className="-mx-2 sm:mx-0">
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
                  </div>
                  <div className="mt-4">
                    <Legend indicator={indicator} classes={classes} />
                  </div>
                </ErrorBoundary>
                {top && bottom && (
                  <p className="mt-4 flex gap-3 rounded-2xl bg-forest-500/[0.07] p-3.5 text-sm leading-relaxed dark:bg-forest-400/[0.07]">
                    <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest-600 dark:text-forest-300" />
                    <span>
                      <strong className="font-semibold">{top.m.nome}</strong> lidera com {indicator.format(top.value)};{' '}
                      <strong className="font-semibold">{bottom.m.nome}</strong> fica na ponta oposta, com {indicator.format(bottom.value)}.
                      {ratio != null && ratio >= 2 && (
                        <span className="muted">
                          {' '}
                          O primeiro tem{' '}
                          {ratio >= 10 ? Math.round(ratio).toLocaleString('pt-BR') : ratio.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} vezes o valor
                          do último.
                        </span>
                      )}
                    </span>
                  </p>
                )}
              </div>

              <div id="perfil" ref={perfilRef} className="scroll-mt-44 lg:col-span-5">
                <ErrorBoundary label="os detalhes do município">
                  <Suspense fallback={<div className="card h-[38rem] animate-pulse" />}>
                    <Detail
                      municipios={data.municipios}
                      selected={selected}
                      compare={compare}
                      periods={data.periods}
                      onCompareChange={setCompareId}
                      indicator={indicator}
                    />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </section>

          {/* 03 · Ranking */}
          <section id="ranking" aria-label="Ranking" className="scroll-mt-44 space-y-6">
            <SectionHeader id="ranking" n="03" hint="Ranking e distribuição" title={`Quem lidera em ${indicator.label.toLowerCase()}`} />
            <div className="grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
              <ErrorBoundary label="o ranking">
                <Ranking
                  className="lg:col-span-7"
                  indicator={indicator}
                  period={indicator.period(data.periods)}
                  ranking={ranking}
                  selectedId={selected.id}
                  hoveredId={hoveredId}
                  onSelect={pickFar}
                  onHover={setHoveredId}
                  colorOf={classes.colorOf}
                  onDownload={() =>
                    downloadText(
                      `amazonas-ranking-${indicator.key}-${indicator.period(data.periods)}.csv`,
                      rankingCsv(indicator, ranking, data.periods, data.fetchedAt),
                    )
                  }
                />
              </ErrorBoundary>
              <ErrorBoundary label="o panorama">
                <Panorama
                  className="lg:col-span-5"
                  indicator={indicator}
                  ranking={ranking}
                  classes={classes}
                  selectedId={selected.id}
                  compareId={compare?.id ?? null}
                  hoveredId={hoveredId}
                  onSelect={pickFar}
                  onHover={setHoveredId}
                />
              </ErrorBoundary>
            </div>
          </section>
        </div>

        {/* 04 · Economia */}
        <section id="economia" aria-label="Economia" className="scroll-mt-28 space-y-6">
          <SectionHeader id="economia" n="04" hint="Economia" title="Tamanho, riqueza e vocação de cada município" />
          <Deferred label="o gráfico de dispersão" minHeight={600}>
            <Scatter
              municipios={data.municipios}
              periods={data.periods}
              selectedId={selected.id}
              compareId={compare?.id ?? null}
              hoveredId={hoveredId}
              onSelect={pickFar}
              onHover={setHoveredId}
            />
          </Deferred>
          <Deferred label="o perfil setorial" minHeight={640}>
            <SectorProfile
              municipios={data.municipios}
              periods={data.periods}
              selectedId={selected.id}
              hoveredId={hoveredId}
              onSelect={pickFar}
              onHover={setHoveredId}
            />
          </Deferred>
        </section>

        {/* 05 · Sobre */}
        <div className="pt-6">
          <ErrorBoundary label="a seção Sobre os dados">
            <About
              periods={data.periods}
              fetchedAt={data.fetchedAt}
              onDownloadAll={() => downloadText('amazonas-municipios.csv', municipiosCsv(data.municipios, data.periods, data.fetchedAt))}
            />
          </ErrorBoundary>
        </div>
      </main>

      {pickedFar && !perfilInView && (
        <div className="animate-rise fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <button
            type="button"
            onClick={goToProfile}
            className="flex items-center gap-3 rounded-full bg-forest-950 py-2 pl-2 pr-4 text-sm text-white shadow-2xl shadow-black/30 ring-1 ring-white/10 transition hover:bg-forest-900"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-white">
              <PinIcon className="h-4 w-4" />
            </span>
            <span>
              <strong className="font-semibold">{selected.nome}</strong> selecionado
            </span>
            <span className="flex items-center gap-1 font-semibold text-forest-300">
              Ver perfil <ArrowRightIcon className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}
    </>
  )
}

/** Barra de escolha do indicador: fica presa no topo em telas largas, rola na horizontal no celular. */
function IndicatorPicker({ value, onChange }: { value: IndicatorKey; onChange: (k: IndicatorKey) => void }) {
  const groups = [...new Set(INDICATORS.map((i) => i.group))]
  return (
    <nav
      aria-label="Escolha o indicador"
      className="card z-30 p-2 md:sticky md:top-[4.5rem] md:bg-white/90 md:backdrop-blur-xl dark:md:bg-night-900/90"
    >
      <div className="scroll-thin relative flex gap-x-1 gap-y-1 overflow-x-auto md:flex-wrap md:overflow-visible">
        {groups.map((g, gi) => {
          const Icon = GROUP_ICON[g]
          return (
            <div
              key={g}
              className={`flex shrink-0 items-center gap-1 px-1.5 py-0.5 ${gi > 0 ? 'border-l border-night-900/[0.07] pl-2.5 dark:border-white/[0.07]' : ''}`}
            >
              <span className="mr-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] muted" title={g}>
                <Icon className="h-3.5 w-3.5" />
                <span className="max-lg:sr-only">{g}</span>
              </span>
              {INDICATORS.filter((i) => i.group === g).map((i) => (
                <IndicatorChip key={i.key} ind={i} active={i.key === value} onClick={() => onChange(i.key)} />
              ))}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

function IndicatorChip({ ind, active, onClick }: { ind: Indicator; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`btn shrink-0 whitespace-nowrap px-3 py-1.5 text-[13px] ${
        active
          ? 'bg-forest-900 text-white shadow-sm shadow-forest-900/30 dark:bg-forest-300 dark:text-forest-950'
          : 'text-night-900/75 hover:bg-night-900/[0.05] hover:text-night-900 dark:text-sand-100/75 dark:hover:bg-white/[0.07] dark:hover:text-white'
      }`}
    >
      {ind.label}
    </button>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Carregando dados">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card h-[30rem] lg:col-span-8" />
        <div className="card h-[30rem] lg:col-span-4" />
      </div>
    </div>
  )
}

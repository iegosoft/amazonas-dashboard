import { geoMercator, geoPath } from 'd3-geo'
import { useMemo, type ReactNode } from 'react'
import { fmtDate } from '../lib/format'
import type { MunGeo } from '../lib/types'

const STEPS = [
  { n: 1, title: 'Escolha um indicador', text: 'população, PIB, setores…', href: '#mapa' },
  { n: 2, title: 'Clique num município', text: 'no mapa, no ranking ou nos gráficos', href: '#mapa' },
  { n: 3, title: 'Compare e baixe', text: 'lado a lado, com CSV e link', href: '#perfil' },
]

/** Abertura: título, busca de município e o passo a passo de uso. */
export function Hero({ geo, fetchedAt, search, quickPicks }: { geo: MunGeo | null; fetchedAt?: string; search?: ReactNode; quickPicks?: ReactNode }) {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-forest-950 pt-16 text-white">
      <HeroBackdrop geo={geo} />
      <div className="relative mx-auto max-w-7xl px-4 pb-36 pt-10 sm:px-6 sm:pb-40 sm:pt-16">
        <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-forest-200 backdrop-blur">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-400" />
          </span>
          {fetchedAt ? <>Dados do IBGE · atualizados em {fmtDate(fetchedAt)}</> : 'Painel de dados abertos · IBGE'}
        </p>
        <h1
          className="animate-rise mt-5 max-w-3xl font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[4.25rem]"
          style={{ animationDelay: '60ms' }}
        >
          Amazonas <span className="text-forest-300">em números</span>
        </h1>
        <p className="animate-rise mt-4 max-w-xl text-base text-white/70 sm:text-lg" style={{ animationDelay: '120ms' }}>
          População, economia e perfil produtivo dos 62 municípios do estado, com dados oficiais do IBGE atualizados toda semana.
        </p>

        <div className="animate-rise relative z-20 mt-8" style={{ animationDelay: '180ms' }}>
          {search}
          {quickPicks && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">{quickPicks}</div>}
        </div>

        <ol className="animate-rise mt-10 grid max-w-3xl gap-2 sm:grid-cols-3 sm:gap-3" style={{ animationDelay: '240ms' }} aria-label="Como usar o painel">
          {STEPS.map((s) => (
            <li key={s.n}>
              <a
                href={s.href}
                className="group flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur transition hover:border-forest-300/40 hover:bg-white/[0.08]"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest-300 text-xs font-bold text-forest-950">{s.n}</span>
                <span>
                  <span className="block text-sm font-semibold text-white">{s.title}</span>
                  <span className="block text-xs text-white/55">{s.text}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Fundo da abertura: brilho esverdeado e os contornos dos 62 municípios em traço fino. */
function HeroBackdrop({ geo }: { geo: MunGeo | null }) {
  const outline = useMemo(() => {
    if (!geo || geo.features.length === 0) return null
    const path = geoPath(geoMercator().fitSize([800, 570], geo))
    return geo.features.map((f) => path(f) ?? '').join(' ')
  }, [geo])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-forest-500/25 blur-[120px]" />
      <div className="absolute -bottom-40 right-0 h-[30rem] w-[40rem] rounded-full bg-sky-500/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(rgb(255 255 255) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
        }}
      />
      {outline && (
        <svg viewBox="0 0 800 570" className="animate-fade absolute -right-24 top-12 hidden h-[110%] max-h-[44rem] md:block lg:right-0">
          <defs>
            <linearGradient id="hero-fade" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#6ee7b7" stopOpacity="0.55" />
              <stop offset="1" stopColor="#6ee7b7" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path d={outline} fill="rgb(110 231 183 / 0.04)" stroke="url(#hero-fade)" strokeWidth="0.8" strokeLinejoin="round" />
        </svg>
      )}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-forest-950" />
    </div>
  )
}

/** Cabeçalho de capítulo: número, título e uma frase dizendo o que fazer ali. */
export function SectionHeader({ id, n, title, hint, children }: { id: string; n: string; title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="reveal flex flex-wrap items-end justify-between gap-4 pb-1 pt-6">
      <div className="max-w-2xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-forest-700 dark:text-forest-300">
          <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-forest-900 px-1.5 text-[11px] text-white tabular-nums dark:bg-forest-300 dark:text-forest-950">
            {n}
          </span>
          <span id={`${id}-eyebrow`}>{hint}</span>
        </p>
        <h2 className="mt-3 font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] sm:text-[2.1rem]">{title}</h2>
      </div>
      {children}
    </div>
  )
}

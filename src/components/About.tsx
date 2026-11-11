import type { ComponentType, ReactNode } from 'react'
import { fmtDate } from '../lib/format'
import { INDICATORS } from '../lib/indicators'
import type { Periods } from '../lib/types'
import { AlertIcon, CalendarIcon, CodeIcon, DownloadIcon, FileIcon, RefreshIcon, ShieldIcon, SparkIcon } from './Icons'

const REPO = 'https://github.com/iegosoft/amazonas-dashboard'

const TOC = [
  { id: 'sobre-indicadores', label: 'Indicadores' },
  { id: 'sobre-coleta', label: 'Como os dados chegam aqui' },
  { id: 'sobre-calendario', label: 'Quando cada dado muda' },
  { id: 'sobre-limitacoes', label: 'Limitações' },
  { id: 'sobre-licenca', label: 'Licença' },
]

/** Seção "Sobre os dados": de onde vem e como é calculado cada número do painel. */
export function About({ periods, fetchedAt, onDownloadAll }: { periods: Periods; fetchedAt: string; onDownloadAll: () => void }) {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="card reveal scroll-mt-24 overflow-hidden text-sm leading-relaxed text-night-900/80 dark:text-sand-100/80"
    >
      <div className="relative border-b border-night-900/[0.06] bg-gradient-to-br from-forest-50 to-sand-50 p-6 sm:p-10 dark:border-white/[0.06] dark:from-forest-950/60 dark:to-night-900">
        <p className="eyebrow">Transparência</p>
        <h2 id="sobre-titulo" className="mt-1 font-display text-3xl font-semibold tracking-tight text-night-900 sm:text-4xl dark:text-white">
          Sobre os dados
        </h2>
        <p className="mt-3 max-w-3xl text-[15px]">
          Todos os números do painel vêm de dados públicos do IBGE. Eles são coletados e conferidos automaticamente toda
          semana; a última atualização foi em <strong className="text-night-900 dark:text-white">{fmtDate(fetchedAt)}</strong>. Abaixo, cada indicador com a fórmula,
          o ano de referência e a tabela de origem, para que qualquer valor possa ser conferido na fonte.
        </p>
        <button type="button" onClick={onDownloadAll} className="btn-solid mt-5">
          <DownloadIcon className="h-4 w-4" />
          Baixar a tabela completa (CSV)
        </button>
      </div>

      <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Nesta seção" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 border-l border-night-900/10 text-[13px] dark:border-white/10">
            {TOC.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="-ml-px block border-l border-transparent py-1 pl-4 muted transition hover:border-forest-500 hover:text-night-900 dark:hover:text-white">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-12">
          <Block id="sobre-indicadores" title="Indicadores" Icon={SparkIcon}>
            <dl className="grid gap-3 md:grid-cols-2">
              {INDICATORS.map((ind) => {
                const note = ind.note?.(periods)
                return (
                  <div
                    key={ind.key}
                    id={`sobre-${ind.key}`}
                    className="scroll-mt-24 rounded-2xl border border-night-900/[0.07] bg-sand-50/60 p-4 transition target:border-forest-500 target:bg-forest-50 target:ring-4 target:ring-forest-500/15 dark:border-white/[0.07] dark:bg-night-800/50 dark:target:bg-forest-950/50"
                  >
                    <dt className="flex items-baseline justify-between gap-2 font-semibold text-night-900 dark:text-white">
                      {ind.label}
                      <span className="shrink-0 rounded-full bg-night-900/[0.05] px-2 py-0.5 text-[11px] font-medium tabular-nums muted dark:bg-white/[0.06]">
                        {ind.period(periods)}
                      </span>
                    </dt>
                    <dd className="mt-1.5">{ind.method}</dd>
                    <dd className="mt-2.5 text-xs muted">
                      Fonte: IBGE,{' '}
                      {ind.sources.map((s, i) => (
                        <span key={s.url}>
                          {i > 0 && ' e '}
                          <a href={s.url} target="_blank" rel="noreferrer" className="link hover:text-night-900 dark:hover:text-white">
                            {s.label}
                          </a>
                        </span>
                      ))}
                    </dd>
                    {note && (
                      <dd className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                        <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                        {note}
                      </dd>
                    )}
                  </div>
                )
              })}
            </dl>
          </Block>

          <Block id="sobre-coleta" title="Como os dados chegam aqui" Icon={RefreshIcon}>
            <ol className="relative max-w-3xl space-y-5 border-l border-dashed border-forest-500/40 pl-7">
              {[
                'Toda segunda-feira, um processo automático busca os dados na API do IBGE.',
                'Antes de publicar, os dados passam por checagens: os 62 municípios presentes, cada um com seu contorno no mapa; população, Censo, densidade e PIB preenchidos; setores somando 100%; população do estado numa faixa plausível; e nenhuma mudança brusca em relação à coleta anterior (nenhum ano voltando no tempo, nenhum município mudando mais de 20% de população).',
                'Se tudo estiver certo e algo tiver mudado, os dados são publicados e o site é atualizado.',
                'Se algo falhar, nada é publicado: o painel continua com os últimos dados válidos e o problema é registrado.',
              ].map((step, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[2.45rem] grid h-6 w-6 place-items-center rounded-full bg-forest-900 text-[11px] font-semibold text-white ring-4 ring-white dark:bg-forest-300 dark:text-forest-950 dark:ring-night-900">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-5 max-w-3xl">
              O histórico de cada atualização fica público no{' '}
              <a href={`${REPO}/commits/data`} target="_blank" rel="noreferrer" className="link font-medium text-forest-700 dark:text-forest-300">
                repositório do projeto
              </a>
              .
            </p>
          </Block>

          <Block id="sobre-calendario" title="Quando cada dado muda" Icon={CalendarIcon}>
            <ul className="grid gap-3 sm:grid-cols-3">
              <Cadence title="Estimativas de população" current={periods.pop}>
                Divulgadas uma vez por ano, em geral até o fim de agosto.
              </Cadence>
              <Cadence title="PIB dos Municípios" current={periods.pib}>
                Divulgado uma vez por ano, em geral em dezembro, com cerca de dois anos de defasagem. A divisão por setor pode
                sair depois do PIB total (atual: {periods.va}).
              </Cadence>
              <Cadence title="Censo Demográfico" current={periods.censo}>
                População e densidade só mudam no próximo Censo.
              </Cadence>
            </ul>
          </Block>

          <Block id="sobre-limitacoes" title="Limitações" Icon={ShieldIcon}>
            <ul className="max-w-3xl space-y-2.5">
              {[
                'Os indicadores não são todos do mesmo ano; cada um mostra o seu ano de referência, e o painel avisa quando um número combina anos diferentes.',
                'Valores que o IBGE ainda não divulgou ou omitiu aparecem como "sem dados" e ficam fora do ranking.',
                'Estimativas de população são projeções, revisadas pelo IBGE a cada novo Censo.',
                'O PIB per capita usa a população do Censo 2022 e pode diferir um pouco do valor oficial do IBGE.',
                'O mapa usa a malha territorial simplificada do IBGE: os contornos são aproximados.',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </Block>

          <Block id="sobre-licenca" title="Licença" Icon={FileIcon}>
            <p className="max-w-3xl">
              Os dados são públicos e de livre reprodução, citando o IBGE como fonte. O código do painel é aberto, sob a{' '}
              <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="link font-medium text-forest-700 dark:text-forest-300">
                licença MIT
              </a>
              , e está no{' '}
              <a href={REPO} target="_blank" rel="noreferrer" className="link font-medium text-forest-700 dark:text-forest-300">
                GitHub
              </a>
              .
            </p>
            <a href={REPO} target="_blank" rel="noreferrer" className="btn-soft mt-4">
              <CodeIcon className="h-4 w-4" />
              Ver o código-fonte
            </a>
          </Block>
        </div>
      </div>
    </section>
  )
}

function Block({ id, title, Icon, children }: { id: string; title: string; Icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24">
      <h3 className="mb-4 flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-night-900 dark:text-white">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-forest-500/10 text-forest-700 dark:text-forest-300">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Cadence({ title, current, children }: { title: string; current: string; children: ReactNode }) {
  return (
    <li className="rounded-2xl border border-night-900/[0.07] p-4 dark:border-white/[0.07]">
      <p className="font-semibold text-night-900 dark:text-white">{title}</p>
      <p className="mt-0.5 font-display text-2xl font-semibold text-forest-700 tabular-nums dark:text-forest-300">{current}</p>
      <p className="mt-1.5 text-[13px]">{children}</p>
    </li>
  )
}

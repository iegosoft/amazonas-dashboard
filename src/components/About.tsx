import { fmtDate } from '../lib/format'
import { INDICATORS } from '../lib/indicators'
import type { Periods } from '../lib/types'

const REPO = 'https://github.com/iegosoft/amazonas-dashboard'

const link = 'underline decoration-dotted underline-offset-2 hover:text-slate-900 dark:hover:text-white'
const h3 = 'mt-8 text-lg font-bold'

/** Seção "Sobre os dados": de onde vem e como é calculado cada número do painel. */
export function About({ periods, fetchedAt }: { periods: Periods; fetchedAt: string }) {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700 sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    >
      <h2 id="sobre-titulo" className="text-2xl font-extrabold text-slate-900 dark:text-white">
        Sobre os dados
      </h2>
      <p className="mt-2 max-w-3xl">
        Todos os números do painel vêm de dados públicos do IBGE. Eles são coletados e conferidos automaticamente toda
        semana; a última atualização foi em <strong>{fmtDate(fetchedAt)}</strong>. Abaixo, cada indicador com a fórmula,
        o ano de referência e a tabela de origem, para que qualquer valor possa ser conferido na fonte.
      </p>

      <h3 className={h3}>Indicadores</h3>
      <dl className="mt-3 grid gap-4 md:grid-cols-2">
        {INDICATORS.map((ind) => {
          const note = ind.note?.(periods)
          return (
            <div
              key={ind.key}
              id={`sobre-${ind.key}`}
              className="scroll-mt-4 rounded-xl border border-slate-200 p-4 target:ring-2 target:ring-emerald-500 dark:border-slate-800"
            >
              <dt className="font-semibold text-slate-900 dark:text-white">
                {ind.label} <span className="font-normal text-slate-500 dark:text-slate-400">· {ind.period(periods)}</span>
              </dt>
              <dd className="mt-1">{ind.method}</dd>
              <dd className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Fonte: IBGE,{' '}
                {ind.sources.map((s, i) => (
                  <span key={s.url}>
                    {i > 0 && ' e '}
                    <a href={s.url} target="_blank" rel="noreferrer" className={link}>
                      {s.label}
                    </a>
                  </span>
                ))}
              </dd>
              {note && <dd className="mt-1 text-xs text-amber-700 dark:text-amber-400">{note}</dd>}
            </div>
          )
        })}
      </dl>

      <h3 className={h3}>Como os dados chegam aqui</h3>
      <ol className="mt-2 max-w-3xl list-decimal space-y-1 pl-5">
        <li>Toda segunda-feira, um processo automático busca os dados na API do IBGE.</li>
        <li>
          Antes de publicar, os dados passam por checagens: os 62 municípios presentes, cada um com seu contorno no mapa;
          população, Censo, densidade e PIB preenchidos; setores somando 100%; população do estado numa faixa plausível;
          e nenhuma mudança brusca em relação à coleta anterior (nenhum ano voltando no tempo, nenhum município mudando
          mais de 20% de população).
        </li>
        <li>Se tudo estiver certo e algo tiver mudado, os dados são publicados e o site é atualizado.</li>
        <li>Se algo falhar, nada é publicado: o painel continua com os últimos dados válidos e o problema é registrado.</li>
      </ol>
      <p className="mt-2 max-w-3xl">
        O histórico de cada atualização fica público no{' '}
        <a href={`${REPO}/commits/data`} target="_blank" rel="noreferrer" className={link}>
          repositório do projeto
        </a>
        .
      </p>

      <h3 className={h3}>Quando cada dado muda</h3>
      <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5">
        <li>
          <strong>Estimativas de população</strong> (atual: {periods.pop}): divulgadas uma vez por ano, em geral até o fim
          de agosto.
        </li>
        <li>
          <strong>PIB dos Municípios</strong> (atual: {periods.pib}): divulgado uma vez por ano, em geral em dezembro, com
          cerca de dois anos de defasagem. A divisão por setor pode sair depois do PIB total (atual: {periods.va}).
        </li>
        <li>
          <strong>Censo Demográfico</strong> ({periods.censo}): população e densidade só mudam no próximo Censo.
        </li>
      </ul>

      <h3 className={h3}>Limitações</h3>
      <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5">
        <li>Os indicadores não são todos do mesmo ano; cada um mostra o seu ano de referência, e o painel avisa quando um número combina anos diferentes.</li>
        <li>Valores que o IBGE ainda não divulgou ou omitiu aparecem como "sem dados" e ficam fora do ranking.</li>
        <li>Estimativas de população são projeções, revisadas pelo IBGE a cada novo Censo.</li>
        <li>O PIB per capita usa a população do Censo 2022 e pode diferir um pouco do valor oficial do IBGE.</li>
        <li>O mapa usa a malha territorial simplificada do IBGE: os contornos são aproximados.</li>
      </ul>

      <h3 className={h3}>Licença</h3>
      <p className="mt-2 max-w-3xl">
        Os dados são públicos e de livre reprodução, citando o IBGE como fonte. O código do painel é aberto, sob a{' '}
        <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className={link}>
          licença MIT
        </a>
        , e está no{' '}
        <a href={REPO} target="_blank" rel="noreferrer" className={link}>
          GitHub
        </a>
        .
      </p>
    </section>
  )
}

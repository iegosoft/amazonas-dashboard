import type { RawIbge } from './ibge'
import type { AgregadoVariavel, Dataset, Municipio, Periods } from './types'

/** Limites das checagens. Valores fora deles bloqueiam a publicação dos dados. */
export const RULES = {
  municipios: 62,
  /** População total do estado plausível (Censo 2022: ~3,9 mi; estimativas recentes: ~4,3 mi). */
  popTotal: [3_500_000, 5_500_000] as const,
  /** Variação máxima da população de um município entre duas coletas. */
  maxPopChange: 0.2,
  /** Variação máxima do PIB somado do estado entre duas coletas. */
  maxPibTotalChange: 0.4,
  /** Tolerância da soma das participações setoriais em torno de 100%. */
  shareSumTolerance: 0.5,
}

export interface Report {
  errors: string[]
  warnings: string[]
}

/** Lista curta de nomes para mensagens: "A, B, C e mais 4". */
const names = (ms: Municipio[], max = 5) =>
  ms.length <= max ? ms.map((m) => m.nome).join(', ') : `${ms.slice(0, max).map((m) => m.nome).join(', ')} e mais ${ms.length - max}`

/**
 * Confere o formato de uma resposta de agregado antes de interpretá-la, para que uma
 * mudança na API do IBGE apareça como erro claro e não como dados vazios.
 */
export function checkAgregado(name: string, json: unknown, variaveis: string[]): string[] {
  if (!Array.isArray(json)) return [`${name}: a resposta não é uma lista`]
  const errors: string[] = []
  for (const id of variaveis) {
    const v = (json as Partial<AgregadoVariavel>[]).find((x) => x?.id === id)
    const series = v?.resultados?.[0]?.series
    if (!v) errors.push(`${name}: variável ${id} ausente na resposta`)
    else if (!Array.isArray(series)) errors.push(`${name}: variável ${id} sem séries`)
    else {
      if (series.length !== RULES.municipios)
        errors.push(`${name}: variável ${id} trouxe ${series.length} municípios (esperado ${RULES.municipios})`)
      if (series.some((s) => typeof s?.localidade?.id !== 'string' || typeof s?.serie !== 'object' || s.serie === null))
        errors.push(`${name}: variável ${id} com série em formato inesperado`)
    }
  }
  return errors
}

export function checkRaw(raw: RawIbge): string[] {
  const errors = [
    ...checkAgregado('Estimativas de população', raw.pop, ['9324']),
    ...checkAgregado('Censo 2022', raw.censo, ['93', '614']),
    ...checkAgregado('PIB dos municípios', raw.pib, ['37', '513', '517', '6575', '525']),
  ]
  if (!Array.isArray(raw.meta)) errors.push('Localidades: a resposta não é uma lista')
  else if (raw.meta.length !== RULES.municipios)
    errors.push(`Localidades: ${raw.meta.length} municípios (esperado ${RULES.municipios})`)
  if (raw.geo?.type !== 'FeatureCollection' || !Array.isArray(raw.geo.features))
    errors.push('Malha: a resposta não é um GeoJSON FeatureCollection')
  return errors
}

const CORE: (keyof Municipio)[] = ['popEst', 'popCenso', 'densidade', 'pib']
const SHARES = ['shareAgro', 'shareInd', 'shareServ', 'shareAdm'] as const
const PERIOD_LABEL: Record<keyof Periods, string> = {
  pop: 'da estimativa de população',
  censo: 'do Censo',
  pib: 'do PIB',
  va: 'do valor adicionado por setor',
}

const total = (ms: Municipio[], k: 'popEst' | 'pib') => ms.reduce((a, m) => a + (m[k] ?? 0), 0)

/** Checa o dataset montado e, se houver, compara com o publicado anteriormente. */
export function validateDataset(next: Dataset, prev?: Dataset): Report {
  const errors: string[] = []
  const warnings: string[] = []
  const ms = next.municipios

  // Identidade dos municípios
  if (ms.length !== RULES.municipios) errors.push(`${ms.length} municípios (esperado ${RULES.municipios})`)
  const ids = new Set(ms.map((m) => m.id))
  if (ids.size !== ms.length) errors.push('Há códigos de município repetidos')
  const badIds = ms.filter((m) => !/^13\d{5}$/.test(m.id))
  if (badIds.length) errors.push(`Códigos fora do padrão do Amazonas (13xxxxx): ${names(badIds)}`)

  // Malha casa com os municípios
  const geoIds = new Set(next.geo.features.map((f) => f.properties.codarea))
  const semMalha = ms.filter((m) => !geoIds.has(m.id))
  if (semMalha.length) errors.push(`Municípios sem geometria no mapa: ${names(semMalha)}`)
  const sobra = [...geoIds].filter((id) => !ids.has(id))
  if (sobra.length) errors.push(`Geometrias sem município correspondente: ${sobra.join(', ')}`)

  // Indicadores essenciais presentes e positivos
  for (const k of CORE) {
    const faltando = ms.filter((m) => m[k] == null)
    if (faltando.length) errors.push(`"${k}" ausente em: ${names(faltando)}`)
    const invalidos = ms.filter((m) => typeof m[k] === 'number' && !((m[k] as number) > 0))
    if (invalidos.length) errors.push(`"${k}" zerado ou negativo em: ${names(invalidos)}`)
  }

  // Perfil setorial
  const semSetor = ms.filter((m) => SHARES.some((k) => m[k] == null))
  if (semSetor.length === ms.length) errors.push('Nenhum município com valor adicionado por setor')
  else if (semSetor.length) warnings.push(`Sem valor adicionado por setor: ${names(semSetor)}`)
  const somaErrada = ms.filter((m) => {
    if (SHARES.some((k) => m[k] == null)) return false
    const s = SHARES.reduce((a, k) => a + (m[k] ?? 0), 0)
    return Math.abs(s - 100) > RULES.shareSumTolerance
  })
  if (somaErrada.length) errors.push(`Participações setoriais não somam 100%: ${names(somaErrada)}`)

  // Ordem de grandeza do estado
  const pop = total(ms, 'popEst')
  const [lo, hi] = RULES.popTotal
  if (pop < lo || pop > hi)
    errors.push(`População total de ${pop.toLocaleString('pt-BR')} fora da faixa plausível (${lo.toLocaleString('pt-BR')}–${hi.toLocaleString('pt-BR')})`)

  // Períodos
  for (const k of Object.keys(PERIOD_LABEL) as (keyof Periods)[])
    if (!/^\d{4}$/.test(next.periods[k] ?? '')) errors.push(`Ano ${PERIOD_LABEL[k]} inválido: "${next.periods[k] ?? ''}"`)

  if (!prev) return { errors, warnings }

  // Comparação com a última publicação
  for (const k of Object.keys(PERIOD_LABEL) as (keyof Periods)[])
    if (next.periods[k] < prev.periods[k])
      errors.push(`Ano ${PERIOD_LABEL[k]} voltou de ${prev.periods[k]} para ${next.periods[k]}`)

  const before = new Map(prev.municipios.map((m) => [m.id, m]))
  const saltos = ms.filter((m) => {
    const a = before.get(m.id)?.popEst
    return a != null && m.popEst != null && Math.abs(m.popEst / a - 1) > RULES.maxPopChange
  })
  if (saltos.length)
    errors.push(`População mudou mais de ${RULES.maxPopChange * 100}% desde a última coleta em: ${names(saltos)}`)

  const pibAntes = total(prev.municipios, 'pib')
  const pibDepois = total(ms, 'pib')
  if (pibAntes > 0 && Math.abs(pibDepois / pibAntes - 1) > RULES.maxPibTotalChange)
    errors.push(`PIB do estado mudou ${((pibDepois / pibAntes - 1) * 100).toFixed(1)}% desde a última coleta`)

  return { errors, warnings }
}

/** Resumo legível do que mudou entre duas publicações (usado no log e na mensagem de commit). */
export function describeChanges(prev: Dataset | undefined, next: Dataset): string[] {
  if (!prev) return ['Primeira coleta: não há publicação anterior para comparar.']
  const lines: string[] = []
  for (const k of Object.keys(PERIOD_LABEL) as (keyof Periods)[])
    if (prev.periods[k] !== next.periods[k]) lines.push(`Ano ${PERIOD_LABEL[k]}: ${prev.periods[k]} → ${next.periods[k]}`)

  const before = new Map(prev.municipios.map((m) => [m.id, JSON.stringify(m)]))
  const mudaram = next.municipios.filter((m) => before.get(m.id) !== JSON.stringify(m)).length
  if (mudaram) lines.push(`${mudaram} de ${next.municipios.length} municípios com valores alterados`)

  const fmt = (v: number) => v.toLocaleString('pt-BR')
  const [p0, p1] = [total(prev.municipios, 'popEst'), total(next.municipios, 'popEst')]
  if (p0 !== p1) lines.push(`População do estado: ${fmt(p0)} → ${fmt(p1)}`)
  const [b0, b1] = [total(prev.municipios, 'pib'), total(next.municipios, 'pib')]
  if (b0 !== b1) lines.push(`PIB do estado (mil R$): ${fmt(b0)} → ${fmt(b1)}`)

  if (JSON.stringify(prev.geo) !== JSON.stringify(next.geo)) lines.push('Malha territorial alterada')
  return lines
}

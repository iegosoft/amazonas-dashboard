import { describe, expect, it } from 'vitest'
import type { Dataset, Municipio } from './types'
import { checkAgregado, describeChanges, validateDataset } from './validate'

const mun = (i: number, over: Partial<Municipio> = {}): Municipio => ({
  id: `13${String(i).padStart(5, '0')}`,
  nome: `Município ${i}`,
  mesorregiao: 'Meso',
  microrregiao: 'Micro',
  popEst: 70_000,
  popCenso: 65_000,
  densidade: 2,
  pib: 1_000_000,
  vaAgro: 10,
  vaInd: 20,
  vaServ: 30,
  vaAdm: 40,
  pibPerCapita: 15_000,
  crescimento: 7,
  shareAgro: 10,
  shareInd: 20,
  shareServ: 30,
  shareAdm: 40,
  ...over,
})

/** 62 municípios × 70 mil hab. ≈ 4,3 mi: dentro da faixa plausível. */
function dataset(edit: (ms: Municipio[]) => Municipio[] = (ms) => ms): Dataset {
  const municipios = edit(Array.from({ length: 62 }, (_, i) => mun(i + 1)))
  return {
    municipios,
    periods: { pop: '2026', censo: '2022', pib: '2023', va: '2021' },
    geo: {
      type: 'FeatureCollection',
      features: Array.from({ length: 62 }, (_, i) => ({
        type: 'Feature' as const,
        properties: { codarea: `13${String(i + 1).padStart(5, '0')}` },
        geometry: { type: 'Polygon' as const, coordinates: [] },
      })),
    },
  }
}

const errorsOf = (d: Dataset, prev?: Dataset) => validateDataset(d, prev).errors.join('\n')

describe('validateDataset', () => {
  it('aceita um dataset coerente', () => {
    expect(validateDataset(dataset())).toEqual({ errors: [], warnings: [] })
  })

  it('exige os 62 municípios e geometria para cada um', () => {
    expect(errorsOf(dataset((ms) => ms.slice(1)))).toMatch(/61 municípios/)
    const d = dataset()
    d.geo.features.pop()
    expect(errorsOf(d)).toMatch(/sem geometria no mapa: Município 62/)
  })

  it('recusa indicador essencial ausente ou zerado', () => {
    expect(errorsOf(dataset((ms) => ms.map((m, i) => (i === 0 ? { ...m, pib: null } : m))))).toMatch(/"pib" ausente em: Município 1/)
    expect(errorsOf(dataset((ms) => ms.map((m, i) => (i === 0 ? { ...m, popEst: 0 } : m))))).toMatch(/"popEst" zerado/)
  })

  it('setores: erro se nenhum município tem, aviso se só alguns faltam', () => {
    const semNenhum = dataset((ms) => ms.map((m) => ({ ...m, shareAgro: null })))
    expect(errorsOf(semNenhum)).toMatch(/Nenhum município com valor adicionado/)
    const semUm = validateDataset(dataset((ms) => ms.map((m, i) => (i === 0 ? { ...m, shareAgro: null } : m))))
    expect(semUm.errors).toEqual([])
    expect(semUm.warnings.join()).toMatch(/Município 1/)
  })

  it('recusa participações setoriais que não somam 100%', () => {
    expect(errorsOf(dataset((ms) => ms.map((m, i) => (i === 0 ? { ...m, shareAgro: 50 } : m))))).toMatch(/não somam 100%/)
  })

  it('recusa população total fora da ordem de grandeza do estado', () => {
    expect(errorsOf(dataset((ms) => ms.map((m) => ({ ...m, popEst: 7 }))))).toMatch(/fora da faixa plausível/)
  })

  it('recusa ano em formato inválido', () => {
    const d = dataset()
    d.periods.va = ''
    expect(errorsOf(d)).toMatch(/Ano do valor adicionado por setor inválido/)
  })

  describe('comparado com a publicação anterior', () => {
    it('recusa ano que volta no tempo', () => {
      const prev = dataset()
      prev.periods.pib = '2024'
      expect(errorsOf(dataset(), prev)).toMatch(/Ano do PIB voltou de 2024 para 2023/)
    })

    it('recusa salto brusco de população em um município', () => {
      const prev = dataset((ms) => ms.map((m, i) => (i === 0 ? { ...m, popEst: 35_000 } : m)))
      expect(errorsOf(dataset(), prev)).toMatch(/mais de 20%.*Município 1/)
    })

    it('recusa salto brusco do PIB do estado', () => {
      const prev = dataset((ms) => ms.map((m) => ({ ...m, pib: 500_000 })))
      expect(errorsOf(dataset(), prev)).toMatch(/PIB do estado mudou 100.0%/)
    })

    it('aceita variações normais', () => {
      const prev = dataset((ms) => ms.map((m) => ({ ...m, popEst: 68_000, pib: 900_000 })))
      expect(validateDataset(dataset(), prev).errors).toEqual([])
    })
  })
})

describe('checkAgregado', () => {
  const series = (n: number) => Array.from({ length: n }, (_, i) => ({ localidade: { id: String(i), nome: '' }, serie: { '2023': '1' } }))

  it('aceita a resposta no formato esperado', () => {
    expect(checkAgregado('PIB', [{ id: '37', resultados: [{ series: series(62) }] }], ['37'])).toEqual([])
  })

  it('aponta mudanças de formato da API do IBGE', () => {
    expect(checkAgregado('PIB', { erro: 'x' }, ['37'])).toEqual(['PIB: a resposta não é uma lista'])
    expect(checkAgregado('PIB', [], ['37'])).toEqual(['PIB: variável 37 ausente na resposta'])
    expect(checkAgregado('PIB', [{ id: '37', resultados: [] }], ['37'])).toEqual(['PIB: variável 37 sem séries'])
    expect(checkAgregado('PIB', [{ id: '37', resultados: [{ series: series(10) }] }], ['37'])[0]).toMatch(/10 municípios/)
    expect(checkAgregado('PIB', [{ id: '37', resultados: [{ series: [{ localidade: { id: 1 }, serie: null }] }] }], ['37']).join()).toMatch(
      /formato inesperado/,
    )
  })
})

describe('describeChanges', () => {
  it('resume anos, municípios e totais que mudaram', () => {
    const prev = dataset((ms) => ms.map((m, i) => (i < 3 ? { ...m, pib: 900_000 } : m)))
    prev.periods.pib = '2022'
    const lines = describeChanges(prev, dataset())
    expect(lines).toContain('Ano do PIB: 2022 → 2023')
    expect(lines).toContain('3 de 62 municípios com valores alterados')
    expect(lines.some((l) => l.startsWith('PIB do estado'))).toBe(true)
    expect(lines.some((l) => l.startsWith('População'))).toBe(false)
  })

  it('identifica a primeira coleta', () => {
    expect(describeChanges(undefined, dataset())[0]).toMatch(/Primeira coleta/)
  })
})

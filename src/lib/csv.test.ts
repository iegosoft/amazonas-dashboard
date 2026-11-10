import { describe, expect, it } from 'vitest'
import { municipiosCsv, rankingCsv, toCsv } from './csv'
import { INDICATOR_BY_KEY, INDICATORS } from './indicators'
import { rankBy } from './stats'
import type { Municipio } from './types'

const periods = { pop: '2026', censo: '2022', pib: '2023', va: '2021' }
const fetchedAt = '2026-11-10T18:00:00Z'
const mun = (id: string, nome: string, pibPerCapita: number | null): Municipio => ({
  id, nome, mesorregiao: 'Centro Amazonense', microrregiao: 'Manaus', popEst: 1000, popCenso: 900, densidade: 1.5, pib: 5000,
  vaAgro: 1, vaInd: 1, vaServ: 1, vaAdm: 1, pibPerCapita, crescimento: 11.1, shareAgro: 25, shareInd: 25, shareServ: 25, shareAdm: 25,
})
const lines = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n')

describe('toCsv', () => {
  it('segue o padrão do Excel em português: BOM, ";" e vírgula decimal', () => {
    const csv = toCsv([['Município', 'Valor'], ['Itapiranga', 1234.567], ['Sem dado', null]])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines(csv)).toEqual(['Município;Valor', 'Itapiranga;1234,57', 'Sem dado;'])
  })

  it('protege textos com ";", aspas ou quebra de linha', () => {
    expect(lines(toCsv([['a;b', 'diz "oi"', 'linha\nnova']]))[0]).toBe('"a;b";"diz ""oi""";"linha\nnova"')
  })
})

describe('rankingCsv', () => {
  it('traz posição, código, município e o indicador com unidade e ano', () => {
    const ms = [mun('1302603', 'Manaus', 61855.4), mun('1301902', 'Itacoatiara', 32066), mun('1300029', 'Alvarães', null)]
    const ind = INDICATOR_BY_KEY.pibPerCapita
    const [fonte, header, ...rows] = lines(rankingCsv(ind, rankBy(ms, ind), periods, fetchedAt))
    expect(fonte).toContain('PIB dos Municípios (tabela 5938)')
    expect(fonte).toContain('10 de novembro de 2026')
    expect(header).toBe('Posição;Código IBGE;Município;PIB per capita (R$, 2023)')
    expect(rows).toEqual(['1;1302603;Manaus;61855,4', '2;1301902;Itacoatiara;32066'])
  })
})

describe('municipiosCsv', () => {
  it('uma linha por município em ordem alfabética, com todos os indicadores', () => {
    const ms = [mun('1302603', 'Manaus', 1), mun('1300029', 'Alvarães', null)]
    const [, header, ...rows] = lines(municipiosCsv(ms, periods, fetchedAt))
    expect(header.split(';')).toHaveLength(4 + INDICATORS.length)
    expect(header).toContain('Peso da indústria (%, 2021)')
    expect(rows.map((r) => r.split(';')[1])).toEqual(['Alvarães', 'Manaus'])
    expect(rows[0]!.split(';')[4 + INDICATORS.findIndex((i) => i.key === 'pibPerCapita')]).toBe('')
  })
})

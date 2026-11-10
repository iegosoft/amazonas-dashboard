import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { INDICATOR_BY_KEY } from '../lib/indicators'
import { classify, rankBy } from '../lib/stats'
import type { MunGeo, Municipio } from '../lib/types'
import { Kpis } from './Kpis'
import { Legend, MapView } from './MapView'
import { Ranking } from './Ranking'

const sq = (x: number, y: number) => ({
  type: 'Polygon' as const,
  coordinates: [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]],
})
const geo: MunGeo = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { codarea: '1' }, geometry: sq(-60, -3) },
    { type: 'Feature', properties: { codarea: '2' }, geometry: sq(-59, -3) },
    { type: 'Feature', properties: { codarea: '3' }, geometry: sq(-60, -4) },
  ],
}
const mk = (id: string, nome: string, popEst: number | null): Municipio => ({
  id, nome, mesorregiao: 'M', microrregiao: 'm', popEst, popCenso: popEst, densidade: 1, pib: popEst ? popEst * 10 : null,
  vaAgro: 1, vaInd: 1, vaServ: 1, vaAdm: 1, pibPerCapita: 10, crescimento: 1, shareAgro: 25, shareInd: 25, shareServ: 25, shareAdm: 25,
})
const municipios = [mk('1', 'Alfa', 300), mk('2', 'Beta', 200), mk('3', 'Gama', null)]

describe('renderização', () => {
  const ind = INDICATOR_BY_KEY.popEst
  const ranking = rankBy(municipios, ind)
  const classes = classify(ranking.map((r) => r.value), ind.interpolator)
  const byId = new Map(municipios.map((m) => [m.id, m]))

  it('mapa desenha um caminho por município, com rótulo acessível e cinza para sem dados', () => {
    const html = renderToString(
      <MapView geo={geo} byId={byId} indicator={ind} classes={classes} rankOf={new Map(ranking.map((r) => [r.m.id, r.rank]))}
        total={2} selectedId="1" compareId={null} hoveredId={null} onSelect={() => {}} onHover={() => {}} />,
    )
    expect(html.match(/<path /g)).toHaveLength(3)
    expect(html).toContain('aria-label="Gama: sem dados"')
    expect(html).toContain('aria-label="Alfa: 300"')
    expect(html).not.toContain('NaN')
  })

  it('legenda, ranking e KPIs renderizam', () => {
    expect(renderToString(<Legend indicator={ind} classes={classes} />)).toContain('sem dados')
    const r = renderToString(<Ranking indicator={ind} ranking={ranking} selectedId="1" hoveredId={null} onSelect={() => {}} onHover={() => {}} />)
    expect(r).toContain('Alfa')
    expect(r).not.toContain('Gama')
    expect(renderToString(<Kpis municipios={municipios} periods={{ pop: '2026', censo: '2022', pib: '2023', va: '2021' }} />)).toContain('Peso de Alfa')
  })
})

// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { DataFile, MunGeo, Municipio } from './lib/types'

const mun = (id: string, nome: string): Municipio => ({
  id, nome, mesorregiao: 'Meso', microrregiao: 'Micro', popEst: 1000, popCenso: 900, densidade: 1, pib: 5000,
  vaAgro: 1, vaInd: 1, vaServ: 1, vaAdm: 1, pibPerCapita: 5000, crescimento: 11, shareAgro: 25, shareInd: 25, shareServ: 25, shareAdm: 25,
})
const file: DataFile = {
  schemaVersion: 1,
  fetchedAt: '2026-11-10T18:00:00Z',
  periods: { pop: '2026', censo: '2022', pib: '2023', va: '2021' },
  municipios: [mun('1301902', 'Itacoatiara'), mun('1302603', 'Manaus')],
}
const geo: MunGeo = { type: 'FeatureCollection', features: [] }

describe('App: links com #âncora', () => {
  let root: Root
  let container: HTMLDivElement
  const scrolled: string[] = []

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.endsWith('malha.json') ? geo : file)))
    HTMLElement.prototype.scrollIntoView = function () {
      scrolled.push(this.id)
    }
    container = document.createElement('div')
    document.body.append(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    scrolled.length = 0
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('abre direto na explicação do indicador e mantém o # na URL', async () => {
    window.history.replaceState(null, '', '/?i=pibPerCapita#sobre-pibPerCapita')
    root = createRoot(container)
    await act(async () => root.render(<App />))
    await vi.waitFor(() => expect(document.getElementById('sobre-pibPerCapita')).not.toBeNull())

    expect(scrolled).toContain('sobre-pibPerCapita')
    expect(window.location.hash).toBe('#sobre-pibPerCapita')
    expect(window.location.search).toContain('i=pibPerCapita')
  })

  it('sem #, não rola a página', async () => {
    window.history.replaceState(null, '', '/?i=popEst')
    root = createRoot(container)
    await act(async () => root.render(<App />))
    await vi.waitFor(() => expect(document.getElementById('sobre')).not.toBeNull())

    expect(scrolled).toEqual([])
    expect(window.location.hash).toBe('')
  })
})

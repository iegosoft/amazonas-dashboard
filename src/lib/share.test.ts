import { describe, expect, it, vi } from 'vitest'
import { shareLink } from './share'

const URL_ = 'https://amazonas-dashboard.vercel.app/?i=pib&m=1302603'
const abort = () => Object.assign(new Error('cancelado'), { name: 'AbortError' })
const nav = (share?: () => Promise<void>, write: () => Promise<void> = async () => {}) => ({
  share: share && vi.fn(share),
  clipboard: { writeText: vi.fn(write) } as unknown as Clipboard,
})

describe('shareLink', () => {
  it('no celular usa o menu nativo com o link da tela', async () => {
    const n = nav(async () => {})
    expect(await shareLink(URL_, 'Painel', true, n)).toBe('shared')
    expect(n.share).toHaveBeenCalledWith({ title: 'Painel', url: URL_ })
    expect(n.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('se a pessoa fecha o menu, não copia nada', async () => {
    const n = nav(async () => Promise.reject(abort()))
    expect(await shareLink(URL_, 'Painel', true, n)).toBe('cancelled')
    expect(n.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('se o menu nativo falha, copia o link', async () => {
    const n = nav(async () => Promise.reject(new Error('NotAllowedError')))
    expect(await shareLink(URL_, 'Painel', true, n)).toBe('copied')
    expect(n.clipboard.writeText).toHaveBeenCalledWith(URL_)
  })

  it('no computador copia direto, mesmo havendo menu nativo', async () => {
    const n = nav(async () => {})
    expect(await shareLink(URL_, 'Painel', false, n)).toBe('copied')
    expect(n.share).not.toHaveBeenCalled()
  })

  it('avisa quando não consegue copiar', async () => {
    expect(await shareLink(URL_, 'Painel', false, nav(undefined, async () => Promise.reject(new Error('negado'))))).toBe('failed')
  })
})

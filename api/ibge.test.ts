import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './ibge'

const API = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/13'
const call = (url: string | null, token?: string) =>
  GET(
    new Request(`https://painel.example/api/ibge${url == null ? '' : `?url=${encodeURIComponent(url)}`}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  )

describe('proxy do IBGE', () => {
  beforeEach(() => {
    vi.stubEnv('COLETA_TOKEN', 'segredo')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ id: 13 })))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('repassa a resposta do IBGE com o token certo', async () => {
    const res = await call(API, 'segredo')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 13 })
    expect(vi.mocked(fetch).mock.calls[0]![0].toString()).toBe(API)
  })

  it('recusa sem token, com token errado ou sem token configurado', async () => {
    expect((await call(API)).status).toBe(401)
    expect((await call(API, 'errado')).status).toBe(401)
    vi.stubEnv('COLETA_TOKEN', '')
    expect((await call(API, '')).status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('não vira proxy aberto: só aceita a API do IBGE', async () => {
    for (const url of [
      null,
      'https://exemplo.com/api/x',
      'https://servicodados.ibge.gov.br/outra-coisa',
      'https://servicodados.ibge.gov.br.evil.com/api/x',
      'http://servicodados.ibge.gov.br/api/x',
      'https://user:pw@servicodados.ibge.gov.br/api/x',
      'não é url',
    ])
      expect((await call(url, 'segredo')).status, String(url)).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('devolve 502 com a causa quando o IBGE não responde', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } }))))
    const res = await call(API, 'segredo')
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ erro: 'IBGE sem resposta: UND_ERR_CONNECT_TIMEOUT' })
  })
})

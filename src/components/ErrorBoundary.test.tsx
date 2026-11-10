// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

let quebrar = true
function Instavel() {
  if (quebrar) throw new Error('falha de teste')
  return <p>mapa ok</p>
}

describe('ErrorBoundary', () => {
  let container: HTMLDivElement
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    container = document.createElement('div')
    document.body.append(container)
    quebrar = true
  })
  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  it('isola o bloco que quebrou: o resto da página continua na tela', async () => {
    const root = createRoot(container)
    await act(async () =>
      root.render(
        <main>
          <ErrorBoundary label="o mapa">
            <Instavel />
          </ErrorBoundary>
          <p>ranking ok</p>
        </main>,
      ),
    )
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível exibir o mapa.')
    expect(container.textContent).toContain('ranking ok')
    expect(console.error).toHaveBeenCalledWith('[painel] Falha ao exibir o mapa:', expect.any(Error), expect.any(String))
    await act(async () => root.unmount())
  })

  it('"Tentar de novo" volta a renderizar o bloco', async () => {
    const root = createRoot(container)
    await act(async () =>
      root.render(
        <ErrorBoundary label="o mapa">
          <Instavel />
        </ErrorBoundary>,
      ),
    )
    quebrar = false
    const retry = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Tentar de novo')!
    await act(async () => retry.click())
    expect(container.textContent).toBe('mapa ok')
    await act(async () => root.unmount())
  })
})

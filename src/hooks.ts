import { useCallback, useEffect, useState } from 'react'
import { loadDataset } from './lib/data'
import type { Dataset } from './lib/types'

export type DataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Dataset }

export function useDataset(): [DataState, () => void] {
  const [state, setState] = useState<DataState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    loadDataset(ctrl.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return
        setState({ status: 'error', message: e instanceof Error ? e.message : 'Falha ao carregar os dados.' })
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return [state, retry]
}

export function useTheme(): [boolean, () => void] {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('painel-am:theme')
      if (saved) return saved === 'dark'
    } catch {
      /* ignora */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('painel-am:theme', dark ? 'dark' : 'light')
    } catch {
      /* ignora */
    }
  }, [dark])

  return [dark, () => setDark((d) => !d)]
}

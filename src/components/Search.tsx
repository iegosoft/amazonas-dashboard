import { useId, useMemo, useRef, useState } from 'react'
import { fmtInt } from '../lib/format'
import type { Municipio } from '../lib/types'
import { PinIcon, SearchIcon } from './Icons'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Caixa "Encontre um município" com sugestões, navegável pelo teclado (padrão combobox). */
export function MunicipioSearch({ municipios, onPick }: { municipios: Municipio[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const n = norm(q.trim())
    if (!n) return []
    return municipios
      .filter((m) => norm(m.nome).includes(n))
      .sort((a, b) => Number(!norm(a.nome).startsWith(n)) - Number(!norm(b.nome).startsWith(n)) || (b.popEst ?? 0) - (a.popEst ?? 0))
      .slice(0, 7)
  }, [municipios, q])

  const pick = (m: Municipio) => {
    onPick(m.id)
    setQ('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const show = open && q.trim() !== ''

  return (
    <div className="relative w-full max-w-xl">
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-forest-900/50" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show && results[active] ? `${listId}-${results[active]!.id}` : undefined}
        aria-label="Encontre um município"
        placeholder="Encontre um município… ex.: Parintins"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => Math.min(i + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && results[active]) {
            e.preventDefault()
            pick(results[active]!)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        className="h-14 w-full rounded-2xl border border-white/20 bg-white pl-12 pr-4 text-base text-night-900 shadow-2xl shadow-black/30 outline-none ring-forest-300/50 transition placeholder:text-night-900/45 focus:ring-4"
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          className="animate-fade absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-night-900/10 bg-white p-1.5 text-night-900 shadow-2xl shadow-black/25 dark:border-white/10 dark:bg-night-800 dark:text-sand-100"
        >
          {results.length === 0 && <li className="px-3 py-3 text-sm muted">Nenhum município com esse nome.</li>}
          {results.map((m, i) => (
            <li
              key={m.id}
              id={`${listId}-${m.id}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(m)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? 'bg-forest-500/10' : ''}`}
            >
              <PinIcon className="h-4 w-4 shrink-0 text-forest-600 dark:text-forest-300" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{m.nome}</span>
                <span className="block truncate text-xs muted">{m.mesorregiao}</span>
              </span>
              {m.popEst != null && <span className="shrink-0 text-xs tabular-nums muted">{fmtInt(m.popEst)} hab.</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

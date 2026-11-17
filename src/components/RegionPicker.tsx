import { useMemo, useState } from 'react'
import type { Region } from '../types'

interface Props {
  regions: Region[]
  selected: string[] // коды
  onChange: (codes: string[]) => void
}

const PRESETS: Record<string, string[]> = {
  'Вся Россия': [],
  'Москва и СПб': ['7700000000000', '7800000000000'],
}

export default function RegionPicker({ regions, selected, onChange }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return regions
    return regions.filter((r) => r.name.toLowerCase().includes(q))
  }, [regions, query])

  const toggle = (code: string) => {
    if (selected.includes(code)) onChange(selected.filter((x) => x !== code))
    else onChange([...selected, code])
  }

  return (
    <div className="panel">
      <h3>Регионы</h3>
      <div className="presets">
        {Object.entries(PRESETS).map(([name, codes]) => (
          <button key={name} className="btn btn-small" onClick={() => onChange(codes)}>
            {name}
          </button>
        ))}
      </div>
      <input
        className="input"
        placeholder="Поиск региона…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="region-list">
        {filtered.map((r) => (
          <label key={r.code} className="region-item">
            <input type="checkbox" checked={selected.includes(r.code)} onChange={() => toggle(r.code)} />
            {r.name}
          </label>
        ))}
      </div>
      <div className="muted">
        {selected.length ? `Выбрано регионов: ${selected.length}` : 'Ничего не выбрано — вся Россия'}
      </div>
    </div>
  )
}

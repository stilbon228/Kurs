import { useEffect, useState } from 'react'
import type { Filters } from './types'
import regionsData from './regions.json'
import RegionPicker from './components/RegionPicker'
import Dashboard from './components/Dashboard'

const INITIAL_FILTERS: Filters = {
  regions: [],
  text: '',
  itOnly: false,
  pagesPerRegion: 2,
}

export default function App() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)

  // Прогреваем прокси, чтобы первый запрос пользователя не был долгим
  useEffect(() => {
    fetch('/api/vacancies?limit=1').catch(() => {})
  }, [])

  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }))

  return (
    <div className="app">
      <header className="header">
        <h1>Мониторинг рынка труда и ИТ-компетенций по регионам</h1>
        <p className="muted">
          Данные: открытый API портала «Работа России» (trudvsem.ru) · {regionsData.length} регионов
        </p>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <RegionPicker
            regions={regionsData}
            selected={filters.regions}
            onChange={(codes) => patch({ regions: codes })}
          />
          <div className="panel">
            <h3>Фильтры</h3>
            <label className="field">
              Поиск по тексту вакансии
              <input
                className="input"
                placeholder="например: разработчик"
                value={filters.text}
                onChange={(e) => patch({ text: e.target.value })}
              />
            </label>
            <label className="field region-item">
              <input
                type="checkbox"
                checked={filters.itOnly}
                onChange={(e) => patch({ itOnly: e.target.checked })}
              />
              Только ИТ-вакансии
            </label>
            <label className="field">
              Страниц на регион (по 100 вакансий)
              <input
                className="input"
                type="number"
                min={1}
                max={10}
                value={filters.pagesPerRegion}
                onChange={(e) => patch({ pagesPerRegion: Number(e.target.value) || 1 })}
              />
            </label>
          </div>
        </aside>

        <main className="main">
          <Dashboard filters={filters} />
        </main>
      </div>
    </div>
  )
}

import { useCallback, useState } from 'react'
import type { Filters, Vacancy } from '../types'
import { fetchVacanciesPage, PAGE_SIZE } from '../api'
import { analyze, isItVacancy, type Analysis } from '../analyze'
import { toCsv, downloadCsv } from '../csv'
import { RegionChart, SalaryChart, SkillsChart, ExperienceChart, EducationChart } from './Charts'
import VacancyTable from './VacancyTable'

interface Props {
  filters: Filters
}

export default function Dashboard({ filters }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [progress, setProgress] = useState('')

  /** CSV со всеми загруженными вакансиями */
  const exportVacanciesCsv = () => {
    const csv = toCsv(
      ['Название', 'Регион', 'Зарплата от', 'Зарплата до', 'Работодатель', 'Сфера', 'Образование', 'Опыт (лет)', 'Ссылка'],
      vacancies.map((v) => [
        v.name,
        v.regionName,
        v.salaryMin,
        v.salaryMax,
        v.company,
        v.specialisation,
        v.education,
        v.experienceYears,
        v.url,
      ]),
    )
    downloadCsv(`vacancies-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  /** CSV со сводкой по ИТ-компетенциям */
  const exportSkillsCsv = () => {
    if (!analysis) return
    const csv = toCsv(
      ['Компетенция', 'Вакансий с навыком', 'Доля от загруженных, %'],
      analysis.topSkills.map((s) => [
        s.name,
        s.count,
        analysis.total ? ((s.count / analysis.total) * 100).toFixed(1) : 0,
      ]),
    )
    downloadCsv(`it-skills-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const collected: Vacancy[] = []
    let found = 0
    try {
      // Если регионы не выбраны — один запрос по всей России
      const targets = filters.regions.length ? filters.regions : [undefined]
      for (let i = 0; i < targets.length; i++) {
        const code = targets[i]
        for (let page = 0; page < filters.pagesPerRegion; page++) {
          setProgress(
            `Регион ${i + 1}/${targets.length}, страница ${page + 1}/${filters.pagesPerRegion}…`,
          )
          const { vacancies: items, total } = await fetchVacanciesPage(
            code,
            filters.text,
            page * PAGE_SIZE,
          )
          found += total
          collected.push(...items)
          if ((page + 1) * PAGE_SIZE >= total) break
        }
      }
      const filteredList = filters.itOnly ? collected.filter(isItVacancy) : collected
      setVacancies(filteredList)
      setAnalysis(analyze(filteredList, found))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [filters])

  return (
    <div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          {loading ? 'Загрузка…' : 'Загрузить и проанализировать'}
        </button>
        {analysis && (
          <>
            <button className="btn" onClick={exportVacanciesCsv}>
              ⬇ CSV: вакансии ({vacancies.length})
            </button>
            <button className="btn" onClick={exportSkillsCsv}>
              ⬇ CSV: ИТ-компетенции
            </button>
          </>
        )}
      </div>
      {progress && <span className="muted"> {progress}</span>}
      {error && <div className="error">Ошибка: {error}</div>}

      {analysis && (
        <>
          <div className="cards">
            <div className="card"><div className="card-num">{analysis.found.toLocaleString('ru-RU')}</div>всего найдено</div>
            <div className="card"><div className="card-num">{analysis.total.toLocaleString('ru-RU')}</div>загружено для анализа</div>
            <div className="card"><div className="card-num">{analysis.itCount}</div>ИТ-вакансий</div>
            <div className="card"><div className="card-num">{analysis.withSalary}</div>с зарплатой</div>
            <div className="card">
              <div className="card-num">
                {analysis.salary.median ? `${analysis.salary.median.toLocaleString('ru-RU')} ₽` : '—'}
              </div>
              медианная зарплата
            </div>
          </div>
          <div className="grid-2">
            <RegionChart data={analysis.byRegion} />
            <SalaryChart data={analysis} />
            <SkillsChart data={analysis} />
            <ExperienceChart data={analysis} />
            <EducationChart data={analysis} />
          </div>
          <VacancyTable items={vacancies.slice(0, 50)} />
        </>
      )}
    </div>
  )
}

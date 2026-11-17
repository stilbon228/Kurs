import type { Vacancy } from '../types'

export default function VacancyTable({ items }: { items: Vacancy[] }) {
  if (items.length === 0) return null
  return (
    <div className="panel">
      <h3>Вакансии ({items.length})</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Вакансия</th>
            <th>Регион</th>
            <th>Зарплата</th>
            <th>Работодатель</th>
            <th>Сфера</th>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v.id}>
              <td><a href={v.url} target="_blank" rel="noreferrer">{v.name}</a></td>
              <td>{v.regionName}</td>
              <td>
                {v.salaryMin != null || v.salaryMax != null
                  ? `${v.salaryMin?.toLocaleString('ru-RU') ?? '—'} – ${v.salaryMax?.toLocaleString('ru-RU') ?? '—'} ₽`
                  : '—'}
              </td>
              <td>{v.company}</td>
              <td>{v.specialisation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

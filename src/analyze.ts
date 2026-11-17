// Агрегация вакансий «Работа России» для дашборда
import type { Vacancy } from './types'

/**
 * Словарь ИТ-компетенций: каноничное название -> паттерны поиска.
 * Поле skills у trudvsem почти всегда пустое, поэтому компетенции
 * извлекаем из текста описания (duty) и требований.
 */
export const IT_SKILLS: { name: string; re: RegExp }[] = [
  { name: 'Python', re: /python|питон/ },
  { name: 'Java', re: /\bjava\b(?!script)/ },
  { name: 'JavaScript / TypeScript', re: /javascript|typescript|js\b|ts\b/ },
  { name: '1С', re: /1с|1c\b/ },
  { name: 'SQL', re: /\bsql\b/ },
  { name: 'PostgreSQL', re: /postgres/ },
  { name: 'MySQL / MariaDB', re: /mysql|mariadb/ },
  { name: 'Oracle', re: /oracle/ },
  { name: 'C# / .NET', re: /c#|\.net|c sharp/ },
  { name: 'C / C++', re: /\bc\+\+|\bc\b(?=.*программ)/ },
  { name: 'PHP', re: /\bphp\b/ },
  { name: 'Go', re: /golang|\bgo\b(?=.*разраб)/ },
  { name: 'Swift / iOS', re: /swift|ios-разраб/ },
  { name: 'Kotlin / Android', re: /kotlin|android/ },
  { name: 'HTML / CSS', re: /\bhtml\b|\bcss\b/ },
  { name: 'React', re: /react/ },
  { name: 'Vue / Angular', re: /vue|angular/ },
  { name: 'Linux', re: /linux|линукс|unix/ },
  { name: 'Docker', re: /docker/ },
  { name: 'Kubernetes', re: /kubernetes|k8s/ },
  { name: 'Git', re: /\bgit\b|gitlab|github/ },
  { name: 'CI/CD', re: /ci\/cd|jenkins|devops/ },
  { name: 'Тестирование / QA', re: /тестирован|\bqa\b|test qa/ },
  { name: 'Анализ данных', re: /аналитик данных|data analyst|data science|машинн/i },
  { name: 'SAP / ERP', re: /sap\b|erp\b/ },
  { name: 'AutoCAD / САПР', re: /autocad|сапр|cad/ },
  { name: 'Компьютерные сети', re: /сет(и|евой)|tcp\/ip|cisco/ },
  { name: 'Информационная безопасность', re: /информационн(ая|ой) безопасн|иб\b|защит(а|е) информации/ },
  { name: 'Техподдержка', re: /техподдержк|технической поддержк|helpdesk/ },
]

export interface RegionStat {
  name: string
  count: number
  medianSalary: number | null
}

export interface Analysis {
  total: number
  found: number
  withSalary: number
  itCount: number
  salary: { p25: number | null; median: number | null; p75: number | null; min: number | null; max: number | null }
  byRegion: RegionStat[]
  topSkills: { name: string; count: number }[]
  byExperience: { name: string; count: number }[]
  byEducation: { name: string; count: number }[]
  topSpecialisations: { name: string; count: number }[]
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return Math.round(sorted[lo])
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo))
}

function salaryMid(v: Vacancy): number | null {
  if (v.salaryMin != null && v.salaryMax != null) return (v.salaryMin + v.salaryMax) / 2
  if (v.salaryMin != null) return v.salaryMin
  if (v.salaryMax != null) return v.salaryMax
  return null
}

/** Вакансия относится к ИТ? */
export function isItVacancy(v: Vacancy): boolean {
  const spec = v.specialisation.toLowerCase()
  if (spec.includes('информационн') || spec.includes('ит-') || spec === 'it') return true
  return /программист|разработчик|devops|тестировщик|системный администратор|data science|дата-сайентист/.test(v.name.toLowerCase())
}

function experienceBucket(years: number | null): string {
  if (years == null) return 'Не указан'
  if (years === 0) return 'Без опыта'
  if (years === 1) return '1 год'
  if (years <= 3) return '2–3 года'
  if (years <= 6) return '4–6 лет'
  return 'Более 6 лет'
}

export function analyze(vacancies: Vacancy[], found: number): Analysis {
  const mids = vacancies.map(salaryMid).filter((x): x is number => x != null && x > 0).sort((a, b) => a - b)

  // По регионам
  const regionMap = new Map<string, number[]>()
  for (const v of vacancies) {
    if (!regionMap.has(v.regionName)) regionMap.set(v.regionName, [])
    const mid = salaryMid(v)
    if (mid != null) regionMap.get(v.regionName)!.push(mid)
  }
  const byRegion: RegionStat[] = [...regionMap.entries()]
    .map(([name, arr]) => ({ name, count: arr.length, medianSalary: percentile([...arr].sort((a, b) => a - b), 50) }))
    .sort((a, b) => b.count - a.count)

  // ИТ-компетенции по словарю
  const skillMap = new Map<string, number>()
  for (const v of vacancies) {
    const seen = new Set<string>()
    for (const s of IT_SKILLS) {
      if (s.re.test(v.skillsText) && !seen.has(s.name)) {
        seen.add(s.name)
        skillMap.set(s.name, (skillMap.get(s.name) ?? 0) + 1)
      }
    }
  }
  const topSkills = [...skillMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Опыт
  const expMap = new Map<string, number>()
  for (const v of vacancies) {
    const b = experienceBucket(v.experienceYears)
    expMap.set(b, (expMap.get(b) ?? 0) + 1)
  }
  const byExperience = [...expMap.entries()].map(([name, count]) => ({ name, count }))

  // Образование
  const eduMap = new Map<string, number>()
  for (const v of vacancies) {
    const e = v.education || 'Не указано'
    eduMap.set(e, (eduMap.get(e) ?? 0) + 1)
  }
  const byEducation = [...eduMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Сферы деятельности
  const specMap = new Map<string, number>()
  for (const v of vacancies) {
    const s = v.specialisation || '—'
    specMap.set(s, (specMap.get(s) ?? 0) + 1)
  }
  const topSpecialisations = [...specMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    total: vacancies.length,
    found,
    withSalary: mids.length,
    itCount: vacancies.filter(isItVacancy).length,
    salary: {
      p25: percentile(mids, 25),
      median: percentile(mids, 50),
      p75: percentile(mids, 75),
      min: mids.length ? Math.round(mids[0]) : null,
      max: mids.length ? Math.round(mids[mids.length - 1]) : null,
    },
    byRegion,
    topSkills,
    byExperience,
    byEducation,
    topSpecialisations,
  }
}

// Клиент к прокси (/api -> localhost:3001 -> opendata.trudvsem.ru)
import type { TrudVsemResponse, Vacancy } from './types'

const PAGE_SIZE = 100
/**
 * Баг API trudvsem: запрос с limit=100 и offset>0 возвращает 500.
 * Поэтому первую страницу берём по 100, а последующие — по 90.
 */
function limitFor(offset: number): number {
  return offset === 0 ? 100 : 90
}

async function get(path: string, params?: Record<string, string | number | undefined>): Promise<TrudVsemResponse> {
  const qs = new URLSearchParams()
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') qs.append(k, String(v))
    }
  }
  const url = `/api/${path}${qs.toString() ? '?' + qs.toString() : ''}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `Ошибка API (${res.status})`)
  }
  return res.json() as Promise<TrudVsemResponse>
}

/** Нормализуем вакансию trudvsem к удобному виду */
function normalize(v: TrudVsemResponse['results'] extends never ? never : any): Vacancy {
  const t = v.vacancy ?? v
  return {
    id: t.id,
    name: t['job-name'] ?? '—',
    regionName: t.region?.name ?? '—',
    regionCode: t.region?.region_code ?? '',
    salaryMin: t.salary_min ?? null,
    salaryMax: t.salary_max ?? null,
    company: t.company?.name ?? '—',
    specialisation: t.category?.specialisation ?? '—',
    education: t.requirement?.education ?? 'Не указано',
    experienceYears: typeof t.requirement?.experience === 'number' ? t.requirement.experience : null,
    skillsText: [t.duty ?? '', typeof t.requirement === 'object' ? JSON.stringify(t.requirement) : '']
      .join(' ')
      .toLowerCase(),
    url: t.vac_url ?? '#',
  }
}

/** Одна страница вакансий региона (или всех, если regionCode не задан) */
export async function fetchVacanciesPage(
  regionCode: string | undefined,
  text: string,
  offset: number,
): Promise<{ vacancies: Vacancy[]; total: number }> {
  const params: Record<string, string | number | undefined> = {
    limit: PAGE_SIZE,
    offset,
    text: text || undefined,
  }
  const path = regionCode ? `vacancies/region/${regionCode}` : 'vacancies'

  // Ретрай: при сбое API повторяем с меньшим limit
  let res = await get(path, { ...params, limit: limitFor(offset) })
  if (res.meta?.error || res.status === '500') {
    res = await get(path, { ...params, limit: 50 })
  }
  if (res.meta?.error || res.status === '500') {
    throw new Error('API «Работа России» вернул ошибку, попробуйте ещё раз')
  }

  const items = (res.results?.vacancies ?? []).map(normalize)
  return { vacancies: items, total: res.meta?.total ?? 0 }
}

export { PAGE_SIZE }

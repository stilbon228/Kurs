// Типы данных открытого API «Работа России» (trudvsem.ru)

export interface Region {
  code: string // например "7700000000000"
  name: string
}

export interface VacancyRegion {
  region_code: string
  name: string
}

export interface VacancyCompany {
  name: string
  inn?: string
  url?: string
}

export interface VacancyCategory {
  specialisation?: string
}

export interface VacancyRequirement {
  education?: string
  experience?: number // лет
}

export interface TrudVsemVacancy {
  id: string
  'job-name': string
  region: VacancyRegion
  company?: VacancyCompany
  category?: VacancyCategory
  salary?: string
  salary_min?: number | null
  salary_max?: number | null
  currency?: string
  duty?: string // описание
  requirement?: VacancyRequirement
  skills?: string[]
  vac_url: string
  'creation-date': string
}

export interface VacancyEnvelope {
  vacancy: TrudVsemVacancy
}

export interface TrudVsemResponse {
  status: string
  meta: { total: number; limit: number; offset?: number; error?: string }
  results?: { vacancies?: VacancyEnvelope[] }
  error?: string
}

/** Вакансия, приведённая к удобному для UI виду */
export interface Vacancy {
  id: string
  name: string
  regionName: string
  regionCode: string
  salaryMin: number | null
  salaryMax: number | null
  company: string
  specialisation: string
  education: string
  experienceYears: number | null
  skillsText: string // duty + requirement-текст для анализа компетенций
  url: string
}

export interface Filters {
  regions: string[] // коды регионов
  text: string
  itOnly: boolean // только ИТ-вакансии (по категории/названию)
  pagesPerRegion: number
}

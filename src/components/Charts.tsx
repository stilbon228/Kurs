import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { Analysis } from '../analyze'

const COLORS = ['#4f6df5', '#22a06b', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export function RegionChart({ data }: { data: Analysis['byRegion'] }) {
  const top = data.slice(0, 12)
  return (
    <div className="panel">
      <h3>Вакансии по регионам (топ-12)</h3>
      {top.length === 0 ? <p className="muted">Нет данных.</p> : (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={top} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={170} />
            <Tooltip />
            <Bar dataKey="count" name="Вакансий" fill="#4f6df5" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function SalaryChart({ data }: { data: Analysis }) {
  const s = data.salary
  const chartData = [
    { name: '25-й перцентиль', value: s.p25 },
    { name: 'Медиана', value: s.median },
    { name: '75-й перцентиль', value: s.p75 },
  ].filter((d) => d.value != null)
  return (
    <div className="panel">
      <h3>Зарплаты (середина вилки, ₽)</h3>
      {chartData.length === 0 ? (
        <p className="muted">Нет вакансий с указанной зарплатой.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}к`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString('ru-RU')} ₽`} />
              <Bar dataKey="value" name="₽/мес" fill="#22a06b" />
            </BarChart>
          </ResponsiveContainer>
          <p className="muted">
            Мин: {s.min?.toLocaleString('ru-RU') ?? '—'} ₽ · Макс: {s.max?.toLocaleString('ru-RU') ?? '—'} ₽ ·
            С зарплатой: {data.withSalary} из {data.total}
          </p>
        </>
      )}
    </div>
  )
}

export function SkillsChart({ data }: { data: Analysis }) {
  const top = data.topSkills
  return (
    <div className="panel">
      <h3>Топ ИТ-компетенций (по тексту вакансий)</h3>
      {top.length === 0 ? <p className="muted">Компетенции не найдены.</p> : (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={top} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={200} />
            <Tooltip />
            <Bar dataKey="count" name="Вакансий с навыком" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ExperienceChart({ data }: { data: Analysis }) {
  return (
    <div className="panel">
      <h3>Требуемый опыт</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data.byExperience} dataKey="count" nameKey="name" outerRadius={85} label>
            {data.byExperience.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EducationChart({ data }: { data: Analysis }) {
  return (
    <div className="panel">
      <h3>Образование (топ-8)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data.byEducation} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={220} />
          <Tooltip />
          <Bar dataKey="count" name="Вакансий" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

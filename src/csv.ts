// Экспорт в CSV, дружелюбный к русскому Excel:
// разделитель ";", кодировка UTF-8 с BOM, экранирование кавычек.

function esc(value: unknown): string {
  const s = String(value ?? '')
  // Если в значении есть ;, " или перенос строки — оборачиваем в кавычки
  if (/[;\n\r"]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  const lines = [header.map(esc).join(';'), ...rows.map((r) => r.map(esc).join(';'))]
  return '\uFEFF' + lines.join('\r\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

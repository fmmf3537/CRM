import type { Response } from 'express'

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function streamCsv<T extends Record<string, unknown>>(
  res: Response,
  filename: string,
  columns: { key: keyof T; label: string }[],
  data: T[]
) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.write('\uFEFF')

  res.write(columns.map((c) => escapeCsv(c.label)).join(',') + '\n')

  for (const row of data) {
    const line = columns.map((c) => escapeCsv(row[c.key])).join(',') + '\n'
    res.write(line)
  }

  res.end()
}

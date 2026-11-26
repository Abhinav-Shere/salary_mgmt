const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const count = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export function formatSalary(value: number | null) {
  return value === null ? '—' : currency.format(value)
}

export function formatCount(value: number) {
  return count.format(value)
}

export function formatDate(isoDate: string) {
  return date.format(new Date(`${isoDate}T00:00:00Z`))
}

export function formatPercentDifference(value: number | null, reference: number | null) {
  if (value === null || reference === null || reference === 0) return '—'

  const difference = ((value - reference) / reference) * 100
  return `${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`
}

export function yearsSince(isoDate: string, today = new Date()) {
  const start = new Date(`${isoDate}T00:00:00Z`)
  const years = today.getUTCFullYear() - start.getUTCFullYear()
  const beforeAnniversary =
    today.getUTCMonth() < start.getUTCMonth() ||
    (today.getUTCMonth() === start.getUTCMonth() && today.getUTCDate() < start.getUTCDate())

  return beforeAnniversary ? years - 1 : years
}

export function todayIsoDate(today = new Date()) {
  return today.toISOString().slice(0, 10)
}

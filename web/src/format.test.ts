import { describe, expect, test } from 'vitest'
import { formatDate, formatPercentDifference, formatSalary, todayIsoDate, yearsSince } from './format.ts'

describe('formatSalary', () => {
  test('formats whole US dollars and shows a dash for missing values', () => {
    expect(formatSalary(1234567)).toBe('$1,234,567')
    expect(formatSalary(null)).toBe('—')
  })
})

describe('formatDate', () => {
  test('formats an ISO date without shifting the day', () => {
    expect(formatDate('2021-03-01')).toBe('1 Mar 2021')
  })
})

describe('formatPercentDifference', () => {
  test('shows a signed percentage against the reference', () => {
    expect(formatPercentDifference(75000, 68750)).toBe('+9.1%')
    expect(formatPercentDifference(50000, 62500)).toBe('-20.0%')
  })

  test('shows a dash when either value is missing', () => {
    expect(formatPercentDifference(null, 50000)).toBe('—')
    expect(formatPercentDifference(50000, null)).toBe('—')
  })
})

describe('yearsSince', () => {
  const today = new Date('2026-03-01T12:00:00Z')

  test('counts completed years only', () => {
    expect(yearsSince('2021-03-01', today)).toBe(5)
    expect(yearsSince('2021-03-02', today)).toBe(4)
    expect(yearsSince('2026-01-01', today)).toBe(0)
  })
})

describe('todayIsoDate', () => {
  test('returns the UTC calendar date', () => {
    expect(todayIsoDate(new Date('2026-11-26T23:30:00Z'))).toBe('2026-11-26')
  })
})

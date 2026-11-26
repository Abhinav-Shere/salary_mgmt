import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'
import type { CountryInsights, CountryStats, JobTitleInsights, Summary } from '../api/insights.ts'
import { chooseOption } from '../test/queries.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

const summary: Summary = {
  headcount: 6,
  min_salary: 30000,
  max_salary: 95000,
  average_salary: 57667,
  median_salary: 55000,
  total_payroll: 346000,
  country_count: 2,
}

const countries: CountryStats[] = [
  { country: 'Germany', headcount: 4, min_salary: 50000, max_salary: 95000, average_salary: 68750, median_salary: 65000, total_payroll: 275000 },
  { country: 'India', headcount: 2, min_salary: 30000, max_salary: 41000, average_salary: 35500, median_salary: 35500, total_payroll: 71000 },
]

const germany: CountryInsights = {
  ...countries[0],
  job_titles: [
    { job_title: 'Analyst', headcount: 1, min_salary: 50000, max_salary: 50000, average_salary: 50000, median_salary: 50000, total_payroll: 50000 },
    { job_title: 'Engineer', headcount: 3, min_salary: 60000, max_salary: 95000, average_salary: 75000, median_salary: 70000, total_payroll: 225000 },
  ],
}

const germanEngineers: JobTitleInsights = {
  country: 'Germany',
  job_title: 'Engineer',
  headcount: 3,
  min_salary: 60000,
  max_salary: 95000,
  average_salary: 75000,
  median_salary: 70000,
  total_payroll: 225000,
  country_average_salary: 68750,
  global_average_salary: 59200,
}

const stat = (label: string) => within(screen.getByRole('group', { name: label }))

describe('InsightsPage', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/v1/insights/summary', () => HttpResponse.json(summary)),
      http.get('*/api/v1/insights/countries', () => HttpResponse.json({ countries })),
      http.get('*/api/v1/insights/country', ({ request }) =>
        new URL(request.url).searchParams.get('country') === 'Germany'
          ? HttpResponse.json(germany)
          : HttpResponse.json({ error: 'unexpected' }, { status: 500 }),
      ),
      http.get('*/api/v1/insights/job_title', () => HttpResponse.json(germanEngineers)),
    )
  })

  test('shows the organisation summary and the country comparison', async () => {
    renderApp('/insights')

    expect(await screen.findByText('$346,000')).toBeInTheDocument()
    expect(stat('Employees').getByText('in 2 countries')).toBeInTheDocument()

    const comparison = await screen.findByRole('table', { name: 'Country comparison' })
    expect(within(comparison).getAllByRole('row').map((row) => row.textContent)).toEqual([
      'CountryHeadcountMinimumMedianAverageMaximumAnnual payroll',
      'Germany4$50,000$65,000$68,750$95,000$275,000',
      'India2$30,000$35,500$35,500$41,000$71,000',
    ])
  })

  test('shows minimum, maximum and average salary for the chosen country', async () => {
    const { user } = renderApp('/insights')

    await chooseOption(user, 'Country', 'Germany')

    expect(await screen.findByRole('group', { name: 'Minimum' })).toHaveTextContent('$50,000')
    expect(stat('Maximum').getByText('$95,000')).toBeInTheDocument()
    expect(stat('Average').getByText('$68,750')).toBeInTheDocument()
    expect(stat('Headcount').getByText('4')).toBeInTheDocument()
  })

  test('shows the average for a job title in the country with comparisons', async () => {
    const { user } = renderApp('/insights')

    await chooseOption(user, 'Country', 'Germany')
    await chooseOption(user, 'Job title in Germany', 'Engineer')

    expect(await screen.findByRole('group', { name: 'Average Engineer salary' })).toHaveTextContent('$75,000')
    expect(stat('vs Germany average').getByText('+9.1%')).toBeInTheDocument()
    expect(stat('vs Engineer in all countries').getByText('+26.7%')).toBeInTheDocument()
  })

  test('sorts the job title table by average or by name', async () => {
    const { user } = renderApp('/insights')
    await chooseOption(user, 'Country', 'Germany')

    const table = await screen.findByRole('table', { name: 'Job titles in Germany' })
    const titles = () => within(table).getAllByRole('row').slice(1).map((row) => row.firstChild?.textContent)
    expect(titles()).toEqual(['Engineer', 'Analyst'])

    await user.click(screen.getByText('A–Z'))
    expect(titles()).toEqual(['Analyst', 'Engineer'])
  })

  test('shows an empty state when there are no employees', async () => {
    server.use(
      http.get('*/api/v1/insights/countries', () => HttpResponse.json({ countries: [] })),
      http.get('*/api/v1/insights/summary', () =>
        HttpResponse.json({ ...summary, headcount: 0, country_count: 0, average_salary: null }),
      ),
    )

    renderApp('/insights')

    expect(await screen.findByText('No employees yet.')).toBeInTheDocument()
  })

  test('shows an error that can be retried when a country fails to load', async () => {
    const { user } = renderApp('/insights')

    await chooseOption(user, 'Country', 'India')

    expect(await screen.findByText("Couldn't load India.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

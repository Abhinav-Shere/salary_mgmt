import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'
import { buildEmployee, employeePage, lookups } from '../test/fixtures.ts'
import { chooseOption, field } from '../test/queries.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

describe('EmployeesPage', () => {
  let requestedQueries: URLSearchParams[]

  beforeEach(() => {
    requestedQueries = []
    server.use(http.get('*/api/v1/lookups', () => HttpResponse.json(lookups)))
  })

  function respondWith(page: ReturnType<typeof employeePage>) {
    server.use(
      http.get('*/api/v1/employees', ({ request }) => {
        requestedQueries.push(new URL(request.url).searchParams)
        return HttpResponse.json(page)
      }),
    )
  }

  const lastQuery = () => Object.fromEntries(requestedQueries.at(-1) ?? [])

  test('lists employees with formatted salaries and a page summary', async () => {
    respondWith(
      employeePage(
        [buildEmployee(), buildEmployee({ id: 2, full_name: 'Grace Hopper', country: 'India', salary: 42000 })],
        { total_count: 60, total_pages: 3 },
      ),
    )

    renderApp('/employees')

    expect(await screen.findByRole('link', { name: 'Grace Hopper' })).toHaveAttribute('href', '/employees/2')
    expect(screen.getByText('$42,000')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–25 of 60')).toBeInTheDocument()
  })

  test('requests the chosen page from the server', async () => {
    respondWith(employeePage([buildEmployee()], { total_count: 60, total_pages: 3 }))
    const { user } = renderApp('/employees')

    await user.click(await screen.findByRole('button', { name: '2' }))

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: '2' }))
  })

  test('searches by name and filters by country, going back to the first page', async () => {
    respondWith(employeePage([buildEmployee()], { total_count: 60, total_pages: 3 }))
    const { user } = renderApp('/employees?page=3')

    await user.type(field('Search by name'), 'ada')
    await waitFor(() => expect(lastQuery()).toEqual({ q: 'ada', page: '1' }))

    await chooseOption(user, 'Country', 'Germany')

    await waitFor(() => expect(lastQuery()).toEqual({ q: 'ada', country: 'Germany', page: '1' }))
  })

  test('shows loading rows, then an empty state that clears the filters', async () => {
    respondWith(employeePage([]))
    const { user } = renderApp('/employees?country=Germany')

    expect(screen.getAllByTestId('loading-row')).toHaveLength(5)
    await user.click(await screen.findByRole('button', { name: 'Clear filters' }))

    expect(screen.getByText('No employees match these filters.')).toBeInTheDocument()
    await waitFor(() => expect(lastQuery()).toEqual({ page: '1' }))
  })

  test('shows an error that can be retried', async () => {
    respondWith(employeePage([buildEmployee()]))
    server.use(http.get('*/api/v1/employees', () => new HttpResponse(null, { status: 500 }), { once: true }))
    const { user } = renderApp('/employees')

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: 'Ada Lovelace' })).toBeInTheDocument()
  })
})

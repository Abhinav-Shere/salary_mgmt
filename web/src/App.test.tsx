import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { employeePage, lookups } from './test/fixtures.ts'
import { renderApp } from './test/renderApp.tsx'
import { server } from './test/server.ts'

test('opens the employee list from the root path', async () => {
  server.use(
    http.get('*/api/v1/lookups', () => HttpResponse.json(lookups)),
    http.get('*/api/v1/employees', () => HttpResponse.json(employeePage([]))),
  )

  renderApp('/')

  expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights')
})

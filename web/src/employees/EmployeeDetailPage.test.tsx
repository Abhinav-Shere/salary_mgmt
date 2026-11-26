import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'
import { buildEmployee, employeePage, lookups } from '../test/fixtures.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

describe('EmployeeDetailPage', () => {
  let deleteRequests: number

  beforeEach(() => {
    deleteRequests = 0
    server.use(
      http.get('*/api/v1/employees/1', () => HttpResponse.json(buildEmployee())),
      http.delete('*/api/v1/employees/1', () => {
        deleteRequests += 1
        return new HttpResponse(null, { status: 204 })
      }),
      http.get('*/api/v1/lookups', () => HttpResponse.json(lookups)),
      http.get('*/api/v1/employees', () => HttpResponse.json(employeePage([]))),
    )
  })

  test('shows the employee details', async () => {
    renderApp('/employees/1')

    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByText('$95,000')).toBeInTheDocument()
    expect(screen.getByText(/^1 Mar 2021/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/employees/1/edit')
  })

  test('asks for confirmation before deleting', async () => {
    const { user } = renderApp('/employees/1')

    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText("Delete Ada Lovelace? This can't be undone.")).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deleteRequests).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument()
    expect(deleteRequests).toBe(1)
  })

  test('explains when the employee does not exist', async () => {
    server.use(
      http.get('*/api/v1/employees/1', () => HttpResponse.json({ error: 'Employee not found' }, { status: 404 })),
    )

    renderApp('/employees/1')

    expect(await screen.findByText("This employee doesn't exist. They may have been deleted.")).toBeInTheDocument()
  })
})

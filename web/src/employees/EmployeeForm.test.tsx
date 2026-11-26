import { fireEvent, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'
import { buildEmployee, lookups } from '../test/fixtures.ts'
import { chooseOption, field, findField } from '../test/queries.ts'
import { renderApp } from '../test/renderApp.tsx'
import { server } from '../test/server.ts'

async function fillValidEmployee(user: UserEvent) {
  await user.type(field(/Full name/), 'Ada Lovelace')
  await user.type(field(/Email/), 'ada@example.com')
  await user.type(field(/Job title/), 'Engineer')
  await chooseOption(user, /Department/, 'Engineering')
  await chooseOption(user, /Country/, 'Germany')
  await user.type(field(/Annual salary/), '95000')
  fireEvent.change(field(/Hire date/), { target: { value: '2021-03-01' } })
}

describe('Employee form', () => {
  let postedBodies: unknown[]

  beforeEach(() => {
    postedBodies = []
    server.use(http.get('*/api/v1/lookups', () => HttpResponse.json(lookups)))
  })

  test('validates fields before calling the API', async () => {
    const { user } = renderApp('/employees/new')

    await user.type(field(/Email/), 'not-an-email')
    fireEvent.change(field(/Hire date/), { target: { value: '2999-01-01' } })
    await user.click(screen.getByRole('button', { name: 'Add employee' }))

    expect(field(/Full name/)).toHaveAccessibleDescription('Full name is required')
    expect(field(/Email/)).toHaveAccessibleDescription('Enter a valid email address')
    expect(field(/Annual salary/)).toHaveAccessibleDescription('Salary must be a whole number greater than 0')
    expect(field(/Hire date/)).toHaveAccessibleDescription("Hire date can't be in the future")
    expect(postedBodies).toEqual([])
  })

  test('shows server validation errors on the matching fields', async () => {
    server.use(
      http.post('*/api/v1/employees', () =>
        HttpResponse.json({ errors: { email: ['has already been taken'] } }, { status: 422 }),
      ),
    )
    const { user } = renderApp('/employees/new')

    await fillValidEmployee(user)
    await user.click(screen.getByRole('button', { name: 'Add employee' }))

    expect(await screen.findByText('has already been taken')).toBeInTheDocument()
    expect(field(/Email/)).toHaveAccessibleDescription('has already been taken')
  })

  test('creates the employee and opens their page', async () => {
    const created = buildEmployee({ id: 7 })
    server.use(
      http.post('*/api/v1/employees', async ({ request }) => {
        postedBodies.push(await request.json())
        return HttpResponse.json(created, { status: 201 })
      }),
      http.get('*/api/v1/employees/7', () => HttpResponse.json(created)),
    )
    const { user } = renderApp('/employees/new')

    await fillValidEmployee(user)
    await user.click(screen.getByRole('button', { name: 'Add employee' }))

    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(postedBodies).toEqual([
      {
        employee: {
          full_name: 'Ada Lovelace',
          email: 'ada@example.com',
          job_title: 'Engineer',
          department: 'Engineering',
          country: 'Germany',
          salary: 95000,
          hire_date: '2021-03-01',
        },
      },
    ])
  })

  test('edits an existing employee', async () => {
    let patchedBody: unknown
    server.use(
      http.get('*/api/v1/employees/1', () => HttpResponse.json(buildEmployee())),
      http.patch('*/api/v1/employees/1', async ({ request }) => {
        patchedBody = await request.json()
        return HttpResponse.json(buildEmployee({ job_title: 'Lead Engineer' }))
      }),
    )
    const { user } = renderApp('/employees/1/edit')

    const jobTitle = await findField(/Job title/)
    await user.clear(jobTitle)
    await user.type(jobTitle, 'Lead Engineer')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await screen.findByRole('heading', { name: 'Ada Lovelace' })
    expect(patchedBody).toMatchObject({ employee: { job_title: 'Lead Engineer', salary: 95000 } })
  })
})

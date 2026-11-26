import { Anchor, Button, Group, Pagination, Select, Skeleton, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useEmployees, useLookups, type EmployeeFilters } from '../api/employees.ts'
import { QueryError } from '../components/QueryError.tsx'
import { formatCount, formatDate, formatSalary } from '../format.ts'

type FilterName = 'q' | 'country' | 'job_title'

const COLUMNS = ['Name', 'Job title', 'Department', 'Country', 'Salary', 'Hire date']

function useFilters() {
  const [params, setParams] = useSearchParams()

  const filters: EmployeeFilters = {
    q: params.get('q') ?? '',
    country: params.get('country') ?? '',
    job_title: params.get('job_title') ?? '',
    page: Number(params.get('page') ?? 1),
  }

  const setFilter = (name: FilterName, value: string | null) =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(name, value)
      else next.delete(name)
      next.delete('page')
      return next
    })

  const setPage = (page: number) =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(page))
      return next
    })

  return { filters, setFilter, setPage, clearFilters: () => setParams({}) }
}

export function EmployeesPage() {
  const { filters, setFilter, setPage, clearFilters } = useFilters()
  const [search, setSearch] = useState(filters.q)
  const applySearch = useDebouncedCallback((value: string) => setFilter('q', value.trim()), 300)
  const lookups = useLookups()
  const employees = useEmployees(filters)

  const resetFilters = () => {
    setSearch('')
    clearFilters()
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Employees</Title>
        <Button component={Link} to="/employees/new">
          Add employee
        </Button>
      </Group>

      <Group grow>
        <TextInput
          label="Search by name"
          placeholder="e.g. Priya"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value)
            applySearch(event.currentTarget.value)
          }}
        />
        <Select
          label="Country"
          placeholder="All countries"
          data={lookups.data?.countries ?? []}
          value={filters.country || null}
          onChange={(value) => setFilter('country', value)}
          clearable
          searchable
        />
        <Select
          label="Job title"
          placeholder="All job titles"
          data={lookups.data?.job_titles ?? []}
          value={filters.job_title || null}
          onChange={(value) => setFilter('job_title', value)}
          clearable
          searchable
        />
      </Group>

      {employees.isError ? (
        <QueryError message="Couldn't load employees." onRetry={() => employees.refetch()} />
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {COLUMNS.map((column) => (
                <Table.Th key={column}>{column}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {employees.isPending
              ? Array.from({ length: 5 }, (_, row) => (
                  <Table.Tr key={row} data-testid="loading-row">
                    {COLUMNS.map((column) => (
                      <Table.Td key={column}>
                        <Skeleton height={12} />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              : employees.data.employees.map((employee) => (
                  <Table.Tr key={employee.id}>
                    <Table.Td>
                      <Anchor component={Link} to={`/employees/${employee.id}`}>
                        {employee.full_name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{employee.job_title}</Table.Td>
                    <Table.Td>{employee.department}</Table.Td>
                    <Table.Td>{employee.country}</Table.Td>
                    <Table.Td>{formatSalary(employee.salary)}</Table.Td>
                    <Table.Td>{formatDate(employee.hire_date)}</Table.Td>
                  </Table.Tr>
                ))}
          </Table.Tbody>
        </Table>
      )}

      {employees.data?.meta.total_count === 0 && (
        <Stack align="center" gap="xs">
          <Text>No employees match these filters.</Text>
          <Button variant="subtle" onClick={resetFilters}>
            Clear filters
          </Button>
        </Stack>
      )}

      {employees.data && employees.data.meta.total_count > 0 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {pageSummary(employees.data.meta)}
          </Text>
          <Pagination total={employees.data.meta.total_pages} value={filters.page} onChange={setPage} />
        </Group>
      )}
    </Stack>
  )
}

function pageSummary({ page, per_page, total_count }: { page: number; per_page: number; total_count: number }) {
  const first = (page - 1) * per_page + 1
  const last = Math.min(page * per_page, total_count)
  return `Showing ${formatCount(first)}–${formatCount(last)} of ${formatCount(total_count)}`
}

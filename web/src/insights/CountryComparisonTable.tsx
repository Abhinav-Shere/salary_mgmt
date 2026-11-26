import { Skeleton, Table, Text } from '@mantine/core'
import type { UseQueryResult } from '@tanstack/react-query'
import type { CountryStats } from '../api/insights.ts'
import { QueryError } from '../components/QueryError.tsx'
import { formatCount, formatSalary } from '../format.ts'

interface CountryComparisonTableProps {
  query: UseQueryResult<CountryStats[]>
}

export function CountryComparisonTable({ query }: CountryComparisonTableProps) {
  if (query.isPending) return <Skeleton height={200} />
  if (query.isError) return <QueryError message="Couldn't load the comparison." onRetry={() => query.refetch()} />
  if (query.data.length === 0) return <Text c="dimmed">No employees yet.</Text>

  return (
    <Table striped aria-label="Country comparison">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Country</Table.Th>
          <Table.Th>Headcount</Table.Th>
          <Table.Th>Minimum</Table.Th>
          <Table.Th>Median</Table.Th>
          <Table.Th>Average</Table.Th>
          <Table.Th>Maximum</Table.Th>
          <Table.Th>Annual payroll</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {query.data.map((row) => (
          <Table.Tr key={row.country}>
            <Table.Td>{row.country}</Table.Td>
            <Table.Td>{formatCount(row.headcount)}</Table.Td>
            <Table.Td>{formatSalary(row.min_salary)}</Table.Td>
            <Table.Td>{formatSalary(row.median_salary)}</Table.Td>
            <Table.Td>{formatSalary(row.average_salary)}</Table.Td>
            <Table.Td>{formatSalary(row.max_salary)}</Table.Td>
            <Table.Td>{formatSalary(row.total_payroll)}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

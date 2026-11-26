import { SegmentedControl, Select, SimpleGrid, Skeleton, Stack, Table, Text, Title } from '@mantine/core'
import { useState } from 'react'
import { useCountryInsights, type JobTitleStats } from '../api/insights.ts'
import { QueryError } from '../components/QueryError.tsx'
import { StatCard } from '../components/StatCard.tsx'
import { formatCount, formatSalary } from '../format.ts'
import { JobTitleInsightsCard } from './JobTitleInsightsCard.tsx'

type SortOrder = 'average' | 'title'

function sortJobTitles(jobTitles: JobTitleStats[], order: SortOrder) {
  return [...jobTitles].sort((a, b) =>
    order === 'average'
      ? (b.average_salary ?? 0) - (a.average_salary ?? 0)
      : a.job_title.localeCompare(b.job_title),
  )
}

export function CountryInsightsPanel({ country }: { country: string }) {
  const insights = useCountryInsights(country)
  const [jobTitle, setJobTitle] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('average')

  if (insights.isPending) return <Skeleton height={160} />
  if (insights.isError) return <QueryError message={`Couldn't load ${country}.`} onRetry={() => insights.refetch()} />

  const { data } = insights
  if (data.headcount === 0) return <Text c="dimmed">No employees in {country} yet.</Text>

  return (
    <Stack>
      <SimpleGrid cols={{ base: 2, md: 3, lg: 6 }}>
        <StatCard label="Minimum" value={formatSalary(data.min_salary)} />
        <StatCard label="Maximum" value={formatSalary(data.max_salary)} />
        <StatCard label="Average" value={formatSalary(data.average_salary)} />
        <StatCard label="Median" value={formatSalary(data.median_salary)} />
        <StatCard label="Headcount" value={formatCount(data.headcount)} />
        <StatCard label="Annual payroll" value={formatSalary(data.total_payroll)} />
      </SimpleGrid>

      <Select
        label={`Job title in ${country}`}
        placeholder="Choose a job title"
        data={data.job_titles.map((row) => row.job_title)}
        value={jobTitle}
        onChange={setJobTitle}
        searchable
        clearable
        maw={320}
      />
      {jobTitle && <JobTitleInsightsCard country={country} jobTitle={jobTitle} />}

      <Stack gap="xs">
        <Title order={4}>Job titles in {country}</Title>
        <SegmentedControl
          value={sortOrder}
          onChange={(value) => setSortOrder(value as SortOrder)}
          data={[
            { value: 'average', label: 'Highest average first' },
            { value: 'title', label: 'A–Z' },
          ]}
          w="fit-content"
        />
        <Table striped aria-label={`Job titles in ${country}`}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Job title</Table.Th>
              <Table.Th>Headcount</Table.Th>
              <Table.Th>Minimum</Table.Th>
              <Table.Th>Average</Table.Th>
              <Table.Th>Maximum</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortJobTitles(data.job_titles, sortOrder).map((row) => (
              <Table.Tr key={row.job_title}>
                <Table.Td>{row.job_title}</Table.Td>
                <Table.Td>{formatCount(row.headcount)}</Table.Td>
                <Table.Td>{formatSalary(row.min_salary)}</Table.Td>
                <Table.Td>{formatSalary(row.average_salary)}</Table.Td>
                <Table.Td>{formatSalary(row.max_salary)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  )
}

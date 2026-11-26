import { Paper, Select, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core'
import { useState } from 'react'
import { useCountryComparison, useSummary } from '../api/insights.ts'
import { QueryError } from '../components/QueryError.tsx'
import { StatCard } from '../components/StatCard.tsx'
import { formatCount, formatSalary } from '../format.ts'
import { CountryComparisonTable } from './CountryComparisonTable.tsx'
import { CountryInsightsPanel } from './CountryInsightsPanel.tsx'

function SummaryStrip() {
  const summary = useSummary()

  if (summary.isPending) return <Skeleton height={80} />
  if (summary.isError) return <QueryError message="Couldn't load the summary." onRetry={() => summary.refetch()} />

  const { data } = summary
  return (
    <SimpleGrid cols={{ base: 2, md: 4 }}>
      <StatCard label="Employees" value={formatCount(data.headcount)} hint={`in ${data.country_count} countries`} />
      <StatCard label="Average salary" value={formatSalary(data.average_salary)} />
      <StatCard label="Median salary" value={formatSalary(data.median_salary)} />
      <StatCard label="Annual payroll" value={formatSalary(data.total_payroll)} />
    </SimpleGrid>
  )
}

export function InsightsPage() {
  const countries = useCountryComparison()
  const [country, setCountry] = useState<string | null>(null)

  return (
    <Stack gap="xl">
      <Title order={2}>Salary insights</Title>
      <SummaryStrip />

      <Paper withBorder p="lg" radius="md">
        <Stack>
          <Title order={3}>By country</Title>
          {countries.isError ? (
            <QueryError message="Couldn't load countries." onRetry={() => countries.refetch()} />
          ) : (
            <Select
              label="Country"
              placeholder={countries.isPending ? 'Loading countries…' : 'Choose a country'}
              data={countries.data?.map((row) => row.country) ?? []}
              value={country}
              onChange={setCountry}
              searchable
              maw={320}
            />
          )}
          {country ? (
            <CountryInsightsPanel key={country} country={country} />
          ) : (
            <Text c="dimmed">Choose a country to see its salary range and job titles.</Text>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p="lg" radius="md">
        <Stack>
          <Title order={3}>Country comparison</Title>
          <CountryComparisonTable query={countries} />
        </Stack>
      </Paper>
    </Stack>
  )
}

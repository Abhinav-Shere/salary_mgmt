import { SimpleGrid, Skeleton } from '@mantine/core'
import { useJobTitleInsights } from '../api/insights.ts'
import { QueryError } from '../components/QueryError.tsx'
import { StatCard } from '../components/StatCard.tsx'
import { formatCount, formatPercentDifference, formatSalary } from '../format.ts'

interface JobTitleInsightsCardProps {
  country: string
  jobTitle: string
}

export function JobTitleInsightsCard({ country, jobTitle }: JobTitleInsightsCardProps) {
  const insights = useJobTitleInsights(country, jobTitle)

  if (insights.isPending) return <Skeleton height={80} />
  if (insights.isError) return <QueryError message={`Couldn't load ${jobTitle}.`} onRetry={() => insights.refetch()} />

  const { data } = insights
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
      <StatCard
        label={`Average ${jobTitle} salary`}
        value={formatSalary(data.average_salary)}
        hint={`${formatCount(data.headcount)} people, ${formatSalary(data.min_salary)} to ${formatSalary(data.max_salary)}`}
      />
      <StatCard label="Median" value={formatSalary(data.median_salary)} />
      <StatCard
        label={`vs ${country} average`}
        value={formatPercentDifference(data.average_salary, data.country_average_salary)}
        hint={`${country} average ${formatSalary(data.country_average_salary)}`}
      />
      <StatCard
        label={`vs ${jobTitle} in all countries`}
        value={formatPercentDifference(data.average_salary, data.global_average_salary)}
        hint={`Global average ${formatSalary(data.global_average_salary)}`}
      />
    </SimpleGrid>
  )
}

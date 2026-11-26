import { useQuery } from '@tanstack/react-query'
import { request, toQueryString } from './client.ts'

export interface SalaryStats {
  headcount: number
  min_salary: number | null
  max_salary: number | null
  average_salary: number | null
  median_salary: number | null
  total_payroll: number | null
}

export interface Summary extends SalaryStats {
  country_count: number
}

export interface CountryStats extends SalaryStats {
  country: string
}

export interface JobTitleStats extends SalaryStats {
  job_title: string
}

export interface CountryInsights extends CountryStats {
  job_titles: JobTitleStats[]
}

export interface JobTitleInsights extends SalaryStats {
  country: string
  job_title: string
  country_average_salary: number | null
  global_average_salary: number | null
}

export function useSummary() {
  return useQuery({
    queryKey: ['insights', 'summary'],
    queryFn: () => request<Summary>('/insights/summary'),
  })
}

export function useCountryComparison() {
  return useQuery({
    queryKey: ['insights', 'countries'],
    queryFn: () => request<{ countries: CountryStats[] }>('/insights/countries'),
    select: (data) => data.countries,
  })
}

export function useCountryInsights(country: string | null) {
  return useQuery({
    queryKey: ['insights', 'country', country],
    queryFn: () => request<CountryInsights>(`/insights/country?${toQueryString({ country })}`),
    enabled: country !== null,
  })
}

export function useJobTitleInsights(country: string | null, jobTitle: string | null) {
  return useQuery({
    queryKey: ['insights', 'job_title', country, jobTitle],
    queryFn: () =>
      request<JobTitleInsights>(`/insights/job_title?${toQueryString({ country, job_title: jobTitle })}`),
    enabled: country !== null && jobTitle !== null,
  })
}

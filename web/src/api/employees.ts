import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request, toQueryString } from './client.ts'

export interface Employee {
  id: number
  full_name: string
  job_title: string
  country: string
  department: string
  salary: number
  email: string
  hire_date: string
}

export type EmployeeInput = Omit<Employee, 'id'>

export interface EmployeeFilters {
  q: string
  country: string
  job_title: string
  page: number
}

export interface EmployeePage {
  employees: Employee[]
  meta: { page: number; per_page: number; total_count: number; total_pages: number }
}

export interface Lookups {
  countries: string[]
  departments: string[]
  job_titles: string[]
}

export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', 'list', filters],
    queryFn: () => request<EmployeePage>(`/employees?${toQueryString({ ...filters })}`),
    placeholderData: keepPreviousData,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => request<Employee>(`/employees/${id}`),
  })
}

export function useLookups() {
  return useQuery({
    queryKey: ['lookups'],
    queryFn: () => request<Lookups>('/lookups'),
  })
}

function useInvalidateEmployeeData() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all(
      ['employees', 'lookups', 'insights'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
    )
}

export function useSaveEmployee(id?: number) {
  const invalidate = useInvalidateEmployeeData()

  return useMutation({
    mutationFn: (employee: EmployeeInput) =>
      request<Employee>(id ? `/employees/${id}` : '/employees', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify({ employee }),
      }),
    onSuccess: invalidate,
  })
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployeeData()

  return useMutation({
    mutationFn: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

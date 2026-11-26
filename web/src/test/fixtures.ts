import type { Employee, EmployeePage, Lookups } from '../api/employees.ts'

export const lookups: Lookups = {
  countries: ['Germany', 'India'],
  departments: ['Engineering', 'Finance'],
  job_titles: ['Analyst', 'Engineer'],
}

export function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    full_name: 'Ada Lovelace',
    job_title: 'Engineer',
    country: 'Germany',
    department: 'Engineering',
    salary: 95000,
    email: 'ada@example.com',
    hire_date: '2021-03-01',
    ...overrides,
  }
}

export function employeePage(employees: Employee[], meta: Partial<EmployeePage['meta']> = {}): EmployeePage {
  return {
    employees,
    meta: { page: 1, per_page: 25, total_count: employees.length, total_pages: 1, ...meta },
  }
}

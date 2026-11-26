import { Loader, Paper, Stack, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate, useParams } from 'react-router'
import { useEmployee, useSaveEmployee, type EmployeeInput } from '../api/employees.ts'
import { EmployeeLoadError } from './EmployeeLoadError.tsx'
import { EmployeeForm } from './EmployeeForm.tsx'

export function EditEmployeePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const employee = useEmployee(id)
  const saveEmployee = useSaveEmployee(Number(id))

  if (employee.isPending) return <Loader aria-label="Loading employee" />
  if (employee.isError) return <EmployeeLoadError error={employee.error} onRetry={() => employee.refetch()} />

  const { id: employeeId, ...initialValues } = employee.data

  const update = async (input: EmployeeInput) => {
    const saved = await saveEmployee.mutateAsync(input)
    notifications.show({ color: 'green', message: `${saved.full_name} was updated.` })
    navigate(`/employees/${employeeId}`)
  }

  return (
    <Stack>
      <Title order={2}>Edit {employee.data.full_name}</Title>
      <Paper withBorder p="lg" radius="md">
        <EmployeeForm
          initialValues={initialValues}
          submitLabel="Save changes"
          onSubmit={update}
          onCancel={() => navigate(`/employees/${employeeId}`)}
        />
      </Paper>
    </Stack>
  )
}

import { Paper, Stack, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router'
import { useSaveEmployee, type EmployeeInput } from '../api/employees.ts'
import { EmployeeForm } from './EmployeeForm.tsx'

export function NewEmployeePage() {
  const navigate = useNavigate()
  const saveEmployee = useSaveEmployee()

  const create = async (input: EmployeeInput) => {
    const employee = await saveEmployee.mutateAsync(input)
    notifications.show({ color: 'green', message: `${employee.full_name} was added.` })
    navigate(`/employees/${employee.id}`)
  }

  return (
    <Stack>
      <Title order={2}>Add employee</Title>
      <Paper withBorder p="lg" radius="md">
        <EmployeeForm submitLabel="Add employee" onSubmit={create} onCancel={() => navigate('/employees')} />
      </Paper>
    </Stack>
  )
}

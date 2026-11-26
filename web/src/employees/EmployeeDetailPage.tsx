import { Anchor, Button, Group, Loader, Modal, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { Link, useNavigate, useParams } from 'react-router'
import { useDeleteEmployee, useEmployee } from '../api/employees.ts'
import { formatDate, formatSalary, yearsSince } from '../format.ts'
import { EmployeeLoadError } from './EmployeeLoadError.tsx'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Text>{value}</Text>
    </div>
  )
}

function tenure(hireDate: string) {
  const years = yearsSince(hireDate)
  if (years < 1) return 'less than a year'
  return years === 1 ? '1 year' : `${years} years`
}

export function EmployeeDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const employee = useEmployee(id)
  const deleteEmployee = useDeleteEmployee()
  const [confirmOpen, confirm] = useDisclosure(false)

  if (employee.isPending) return <Loader aria-label="Loading employee" />
  if (employee.isError) return <EmployeeLoadError error={employee.error} onRetry={() => employee.refetch()} />

  const { data } = employee

  const remove = () =>
    deleteEmployee.mutate(data.id, {
      onSuccess: () => {
        notifications.show({ color: 'green', message: `${data.full_name} was deleted.` })
        navigate('/employees')
      },
    })

  return (
    <Stack>
      <Anchor component={Link} to="/employees" size="sm">
        ← All employees
      </Anchor>

      <Group justify="space-between">
        <Title order={2}>{data.full_name}</Title>
        <Group>
          <Button component={Link} to={`/employees/${data.id}/edit`} variant="default">
            Edit
          </Button>
          <Button color="red" onClick={confirm.open}>
            Delete
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="lg" radius="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Field label="Job title" value={data.job_title} />
          <Field label="Department" value={data.department} />
          <Field label="Country" value={data.country} />
          <Field label="Annual salary" value={formatSalary(data.salary)} />
          <Field label="Email" value={data.email} />
          <Field label="Hire date" value={`${formatDate(data.hire_date)} (${tenure(data.hire_date)})`} />
        </SimpleGrid>
      </Paper>

      <Modal opened={confirmOpen} onClose={confirm.close} title="Delete employee">
        <Text mb="md">
          Delete {data.full_name}? This can't be undone.
        </Text>
        {deleteEmployee.isError && (
          <Text c="red" size="sm" mb="md">
            Couldn't delete this employee. Please try again.
          </Text>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={confirm.close}>
            Cancel
          </Button>
          <Button color="red" loading={deleteEmployee.isPending} onClick={remove}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Stack>
  )
}

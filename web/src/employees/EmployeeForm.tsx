import { Alert, Autocomplete, Button, Group, NumberInput, Select, SimpleGrid, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { ApiError } from '../api/client.ts'
import { useLookups, type EmployeeInput } from '../api/employees.ts'
import { todayIsoDate } from '../format.ts'

type FormValues = Omit<EmployeeInput, 'salary'> & { salary: number | string }

const EMPTY_VALUES: FormValues = {
  full_name: '',
  job_title: '',
  country: '',
  department: '',
  salary: '',
  email: '',
  hire_date: '',
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const required = (label: string) => (value: string) => (value.trim() ? null : `${label} is required`)

interface EmployeeFormProps {
  initialValues?: EmployeeInput
  submitLabel: string
  onSubmit: (employee: EmployeeInput) => Promise<unknown>
  onCancel: () => void
}

export function EmployeeForm({ initialValues, submitLabel, onSubmit, onCancel }: EmployeeFormProps) {
  const lookups = useLookups()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    initialValues: initialValues ?? EMPTY_VALUES,
    validate: {
      full_name: required('Full name'),
      job_title: required('Job title'),
      country: required('Country'),
      department: required('Department'),
      email: (value) => (EMAIL_FORMAT.test(value.trim()) ? null : 'Enter a valid email address'),
      salary: (value) =>
        typeof value === 'number' && Number.isInteger(value) && value > 0
          ? null
          : 'Salary must be a whole number greater than 0',
      hire_date: (value) => {
        if (!value) return 'Hire date is required'
        return value > todayIsoDate() ? "Hire date can't be in the future" : null
      },
    },
  })

  const handleSubmit = async (values: FormValues) => {
    setFormError(null)
    setSubmitting(true)

    try {
      await onSubmit({ ...values, salary: Number(values.salary) })
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        form.setErrors(
          Object.fromEntries(Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages.join(', ')])),
        )
      } else {
        setFormError(error instanceof Error ? error.message : 'Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      {formError && (
        <Alert color="red" mb="md" title="Couldn't save the employee">
          {formError}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput label="Full name" withAsterisk {...form.getInputProps('full_name')} />
        <TextInput label="Email" type="email" withAsterisk {...form.getInputProps('email')} />
        <Autocomplete
          label="Job title"
          withAsterisk
          data={lookups.data?.job_titles ?? []}
          {...form.getInputProps('job_title')}
        />
        <Select
          label="Department"
          withAsterisk
          data={lookups.data?.departments ?? []}
          {...form.getInputProps('department')}
        />
        <Select
          label="Country"
          withAsterisk
          searchable
          data={lookups.data?.countries ?? []}
          {...form.getInputProps('country')}
        />
        <NumberInput
          label="Annual salary (USD)"
          withAsterisk
          min={1}
          step={1000}
          allowDecimal={false}
          thousandSeparator=","
          prefix="$"
          {...form.getInputProps('salary')}
        />
        <TextInput label="Hire date" type="date" withAsterisk max={todayIsoDate()} {...form.getInputProps('hire_date')} />
      </SimpleGrid>

      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </Group>
    </form>
  )
}

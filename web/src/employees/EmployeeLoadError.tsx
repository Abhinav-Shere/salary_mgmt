import { Anchor, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'
import { ApiError } from '../api/client.ts'
import { QueryError } from '../components/QueryError.tsx'

interface EmployeeLoadErrorProps {
  error: Error
  onRetry: () => void
}

export function EmployeeLoadError({ error, onRetry }: EmployeeLoadErrorProps) {
  if (error instanceof ApiError && error.status === 404) {
    return (
      <Stack align="flex-start">
        <Text>This employee doesn't exist. They may have been deleted.</Text>
        <Anchor component={Link} to="/employees">
          Back to employees
        </Anchor>
      </Stack>
    )
  }

  return <QueryError message="Couldn't load this employee." onRetry={onRetry} />
}

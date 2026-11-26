import { Alert, Button } from '@mantine/core'

interface QueryErrorProps {
  message: string
  onRetry: () => void
}

export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <Alert color="red" title={message}>
      <Button variant="light" color="red" size="xs" onClick={onRetry}>
        Try again
      </Button>
    </Alert>
  )
}

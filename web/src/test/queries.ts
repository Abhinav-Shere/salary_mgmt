import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export function field(label: string | RegExp) {
  return screen.getByLabelText(label, { selector: 'input' })
}

export function findField(label: string | RegExp) {
  return screen.findByLabelText(label, { selector: 'input' })
}

export async function chooseOption(user: UserEvent, label: string | RegExp, option: string) {
  await user.click(await findField(label))
  await user.click(await screen.findByRole('option', { name: option }))
}

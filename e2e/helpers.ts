import { expect, type Page } from '@playwright/test'

/** Walks the date strip until a day with free times appears, then picks its first time. */
export async function pickFirstFreeTime(page: Page) {
  const dates = page.getByRole('radiogroup', { name: 'Date' }).getByRole('radio')
  const count = await dates.count()
  for (let i = 0; i < count; i++) {
    const day = dates.nth(i)
    if (await day.isDisabled()) continue
    await day.click()
    await expect(day).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('Checking availability…')).toBeHidden()
    const times = page.getByRole('radiogroup', { name: 'Time' }).getByRole('radio')
    if ((await times.count()) > 0) {
      const time = (await times.first().textContent())!.trim()
      await times.first().click()
      return time
    }
  }
  throw new Error('No free time found in the booking window')
}

export async function fillCustomer(page: Page, name: string, phone = '9876543210') {
  await page.getByLabel('Your name').fill(name)
  await page.getByLabel('Mobile number').fill(phone)
}

export function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

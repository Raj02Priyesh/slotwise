import { expect, test } from '@playwright/test'
import { fillCustomer, pickFirstFreeTime, uniqueSuffix } from './helpers'

test('signed-out visitors are sent to log in', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

test('a new owner signs up, sets up a business and manages a customer booking', async ({ page, browser }) => {
  const id = uniqueSuffix()
  const slug = `e2e-${id}`
  const businessName = `E2E Studio ${id}`

  await page.goto('/signup')
  await page.getByLabel('Your name').fill('E2E Owner')
  await page.getByLabel('Email').fill(`owner-${id}@example.test`)
  await page.getByLabel('Password').fill('e2e-password-123')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/onboarding$/)
  await page.getByLabel('Business name').fill(businessName)
  await page.getByLabel('Your booking link').fill(slug)
  await page.getByRole('button', { name: 'Create my booking page' }).click()

  await expect(page).toHaveURL(/\/dashboard\/services\?welcome=1/)
  await page.getByLabel('Service name').fill('Consultation')
  await page.getByLabel('Minutes').fill('30')
  await page.getByLabel('Price (₹)').fill('500')
  await page.getByRole('button', { name: 'Add service' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Consultation' })).toBeVisible()

  // A customer books it from a separate, signed-out browser context
  const context = await browser.newContext()
  const customer = await context.newPage()
  await customer.goto(`/book/${slug}`)
  await expect(customer.getByRole('heading', { name: businessName })).toBeVisible()
  await pickFirstFreeTime(customer) // the only service is preselected
  await fillCustomer(customer, 'Walk-in Wanda', '9123456780')
  await customer.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(customer.getByRole('heading', { name: 'You’re booked!' })).toBeVisible()
  await context.close()

  // The owner sees the booking and cancels it
  await page.goto('/dashboard')
  const row = page.getByRole('listitem').filter({ hasText: 'Walk-in Wanda' })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: /Cancel booking for/ }).click()
  await row.getByRole('button', { name: 'Yes, cancel' }).click()
  await expect(page.getByText('Walk-in Wanda')).toHaveCount(0)
  await page.getByRole('link', { name: 'Cancelled' }).click()
  await expect(page.getByText('Walk-in Wanda')).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

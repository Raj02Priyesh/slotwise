import { expect, test } from '@playwright/test'
import { fillCustomer, pickFirstFreeTime } from './helpers'

test('customer books a demo appointment and cancels it with the private link', async ({ page }) => {
  await page.goto('/book/velvet-vine')
  await expect(page.getByRole('heading', { name: 'Velvet & Vine Salon' })).toBeVisible()

  await page.getByRole('radio', { name: /Blow-dry & styling/ }).click()
  await page.getByRole('radio', { name: 'Anyone available' }).click()
  const time = await pickFirstFreeTime(page)

  // Submitting empty details shows field errors instead of booking
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(page.getByRole('alert').first()).toBeVisible()
  await expect(page).toHaveURL(/\/book\/velvet-vine$/)

  await fillCustomer(page, 'E2E Customer')
  await page.getByRole('button', { name: 'Confirm booking' }).click()

  await expect(page).toHaveURL(/\/book\/velvet-vine\/b\/[A-Z0-9]+\?t=/)
  await expect(page.getByRole('heading', { name: 'You’re booked!' })).toBeVisible()
  await expect(page.getByText(time).first()).toBeVisible()

  await page.getByRole('button', { name: 'Cancel booking' }).click()
  await page.getByRole('button', { name: 'Yes, cancel it' }).click()
  await expect(page.getByRole('button', { name: 'Cancel booking' })).toHaveCount(0)
  await expect(page.getByText(/cancelled/i).first()).toBeVisible()
})

test('a booking link without its private token is not found', async ({ page }) => {
  const res = await page.goto('/book/velvet-vine/b/DEMO01')
  expect(res?.status()).toBe(404)
})

test('an unknown business shows a 404', async ({ page }) => {
  const res = await page.goto('/book/no-such-business-here')
  expect(res?.status()).toBe(404)
})

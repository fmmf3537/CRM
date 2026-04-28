import { test, expect } from '@playwright/test'

test.describe('Opportunity & Pipeline', () => {
  test('should display opportunities list', async ({ page }) => {
    await page.goto('/opportunities')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '商机管理' })).toBeVisible()
  })

  test('should display pipeline view', async ({ page }) => {
    await page.goto('/pipeline')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '销售漏斗' })).toBeVisible()
  })
})

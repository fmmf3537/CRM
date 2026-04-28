import { test, expect } from '@playwright/test'

test.describe('Lead Management', () => {
  test('should display lead list', async ({ page }) => {
    await page.goto('/leads')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '线索管理' })).toBeVisible()
    await expect(page.locator('text=新增线索')).toBeVisible()
  })
})

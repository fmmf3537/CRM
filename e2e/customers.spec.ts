import { test, expect } from '@playwright/test'

test.describe('Customer Management', () => {
  test('should display customer list', async ({ page }) => {
    await page.goto('/customers')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '客户管理' })).toBeVisible()
    await expect(page.locator('text=新增客户')).toBeVisible()
  })
})

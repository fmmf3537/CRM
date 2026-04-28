import { test, expect } from '@playwright/test'

test.describe('Admin Management', () => {
  test('should display user management', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible()
    await expect(page.locator('text=新增用户')).toBeVisible()
  })
})

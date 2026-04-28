import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login with admin credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'password')
    await page.click('button:has-text("登录")')
    await expect(page).toHaveURL(/\//)
    await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible()
  })
})

import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'password')
  await page.click('button:has-text("登录")')
  await page.waitForURL(/\//)
  await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible()
  await page.context().storageState({ path: authFile })
})

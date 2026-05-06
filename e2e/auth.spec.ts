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

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'WrongPass1')
    await page.click('button:has-text("登录")')

    await page.waitForTimeout(1000)
    // Should still be on login page after failed attempt
    const stillOnLogin = await page.locator('input[type="text"]').isVisible()
    expect(stillOnLogin).toBe(true)
  })

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'password')
    await page.click('button:has-text("登录")')
    await page.waitForURL(/\//, { timeout: 10000 })

    // Find and click user menu / logout
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("admin"), .user-menu').first()
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await page.waitForTimeout(300)

      const logoutBtn = page.locator('button:has-text("退出"), text=退出登录').first()
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click()
        await page.waitForTimeout(500)
      }
    }

    // Should be redirected to login
    const onLoginPage = await page.locator('input[type="text"]').isVisible().catch(() => false)
    expect(onLoginPage).toBeTruthy()
  })
})

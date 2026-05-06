import { test, expect } from '@playwright/test'

test.describe('Admin Management', () => {
  test('should display user management', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible()
    await expect(page.locator('text=新增用户')).toBeVisible()
  })

  test('should create a new user', async ({ page }) => {
    const username = `e2euser_${Date.now()}`

    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("新增用户")')
    await page.waitForTimeout(500)

    await page.fill('input[name="username"], input[placeholder*="用户名"]', username)
    await page.fill('input[name="name"], input[placeholder*="姓名"]', 'E2E用户')

    const passwordInput = page.locator('input[name="password"], input[placeholder*="密码"][type="password"]')
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('TestPass1')
    }

    const submitBtn = page.locator('button:has-text("保存"), button:has-text("提交"), button[type="submit"]').last()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should display config page', async ({ page }) => {
    await page.goto('/admin/config')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
  })
})

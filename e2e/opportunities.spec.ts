import { test, expect } from '@playwright/test'

test.describe('Opportunity & Pipeline', () => {
  test('should display opportunities list', async ({ page }) => {
    await page.goto('/opportunities')
    await expect(page.getByRole('heading', { name: '商机管理' })).toBeVisible()
  })

  test('should display pipeline view', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page.getByRole('heading', { name: '销售漏斗' })).toBeVisible()
  })

  test('should create a new opportunity', async ({ page }) => {
    const oppName = `E2E测试商机_${Date.now()}`

    await page.goto('/opportunities')

    const createBtn = page.locator('button:has-text("新增"), button:has-text("新建商机")').first()
    if (await createBtn.isVisible()) {
      await createBtn.click()
      await page.waitForTimeout(500)
    }

    await page.fill('input[name="name"], input[placeholder*="商机名称"]', oppName)

    const submitBtn = page.locator('button:has-text("保存"), button:has-text("提交")').last()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
    }
  })
})

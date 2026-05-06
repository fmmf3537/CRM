import { test, expect } from '@playwright/test'

test.describe('Activity Management', () => {
  test('should display activity list', async ({ page }) => {
    await page.goto('/activities')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '活动管理' })).toBeVisible()
    await expect(page.locator('text=记录活动')).toBeVisible()
  })

  test('should create a new activity', async ({ page }) => {
    const activityTitle = `E2E测试活动_${Date.now()}`

    await page.goto('/activities')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("记录活动")')
    await page.waitForTimeout(500)

    await page.fill('input[name="title"], input[placeholder*="主题"]', activityTitle)

    const typeSelect = page.locator('select[name="type"]')
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('PHONE')
    }

    const submitBtn = page.locator('button:has-text("保存"), button:has-text("提交"), button[type="submit"]').last()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
    }
  })
})

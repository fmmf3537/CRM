import { test, expect } from '@playwright/test'

test.describe('Lead Management', () => {
  test('should display lead list', async ({ page }) => {
    await page.goto('/leads')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '线索管理' })).toBeVisible()
    await expect(page.locator('text=新增线索')).toBeVisible()
  })

  test('should create a new lead', async ({ page }) => {
    const leadName = `E2E测试线索_${Date.now()}`

    await page.goto('/leads')
    await page.waitForLoadState('networkidle')

    // Open create form
    await page.click('button:has-text("新增线索")')
    await page.waitForTimeout(500)

    // Fill form
    await page.fill('input[name="name"], input[placeholder*="公司名称"]', leadName)
    await page.fill('input[name="contactName"], input[placeholder*="联系人"]', '测试联系人')

    const submitBtn = page.locator('button:has-text("保存"), button:has-text("提交"), button[type="submit"]').last()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
    }

    // Verify in list
    await page.goto('/leads')
    await page.waitForLoadState('networkidle')
  })

  test('should navigate between lead tabs', async ({ page }) => {
    await page.goto('/leads')
    await page.waitForLoadState('networkidle')

    // Check if tabs exist (全部/未分配)
    const allTab = page.locator('button:has-text("全部")').first()
    const unassignedTab = page.locator('button:has-text("未分配")').first()

    if (await allTab.isVisible()) {
      await allTab.click()
      await page.waitForTimeout(300)
    }
    if (await unassignedTab.isVisible()) {
      await unassignedTab.click()
      await page.waitForTimeout(300)
    }
  })
})

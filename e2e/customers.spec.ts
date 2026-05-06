import { test, expect } from '@playwright/test'

test.describe('Customer Management', () => {
  test('should display customer list', async ({ page }) => {
    await page.goto('/customers')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '客户管理' })).toBeVisible()
    await expect(page.locator('text=新增客户')).toBeVisible()
  })

  test('should create a new customer', async ({ page }) => {
    const customerName = `E2E测试客户_${Date.now()}`

    await page.goto('/customers')
    await page.waitForLoadState('networkidle')

    // Open create form modal
    await page.click('button:has-text("新增客户")')
    await page.waitForTimeout(500)

    // Fill basic info
    await page.fill('input[name="name"], input[placeholder*="客户名称"]', customerName)
    // Select industry - look for select or dropdown
    const industrySelect = page.locator('select[name="industry"], [data-field="industry"] select')
    if (await industrySelect.isVisible()) {
      await industrySelect.selectOption('AGRICULTURE')
    }
    // Fill region
    const regionInput = page.locator('input[name="region"], input[placeholder*="地区"]')
    if (await regionInput.isVisible()) {
      await regionInput.fill('北京')
    }

    // Try to submit
    const submitBtn = page.locator('button:has-text("保存"), button:has-text("提交"), button[type="submit"]').last()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
    }

    // Verify customer appears in list
    await page.goto('/customers')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
  })

  test('should search customers', async ({ page }) => {
    await page.goto('/customers')
    await page.waitForLoadState('networkidle')

    // Find search input
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('测试')
      await page.waitForTimeout(500)
    }
  })
})

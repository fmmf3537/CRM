import { test, expect } from '@playwright/test'

test.describe('Activity Management', () => {
  test('should display activity list', async ({ page }) => {
    await page.goto('/activities')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '活动管理' })).toBeVisible()
    await expect(page.locator('text=记录活动')).toBeVisible()
  })
})

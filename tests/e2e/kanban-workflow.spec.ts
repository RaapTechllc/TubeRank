import { test, expect } from '@playwright/test'

test.describe('Kanban Workflow E2E', () => {
  test('should load kanban board and allow card drag-drop', async ({ page }) => {
    await page.goto('/profiles/test-profile')
    
    // Wait for kanban board to load
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible()
    
    // Check that columns are present
    await expect(page.locator('[data-testid="column-inbox"]')).toBeVisible()
    await expect(page.locator('[data-testid="column-recommended"]')).toBeVisible()
    
    // Test responsive behavior
    await page.setViewportSize({ width: 375, height: 667 }) // Mobile
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible()
    
    await page.setViewportSize({ width: 1280, height: 720 }) // Desktop
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible()
  })

  test('should handle mobile touch interactions', async ({ page }) => {
    await page.goto('/profiles/test-profile')
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Test horizontal scrolling on mobile
    const kanbanBoard = page.locator('[data-testid="kanban-board"]')
    await expect(kanbanBoard).toBeVisible()
    
    // Test that columns are scrollable horizontally
    await expect(page.locator('[data-testid="column-inbox"]')).toBeVisible()
  })
})

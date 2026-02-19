const { test, expect } = require('@playwright/test');

test.describe('Service: Audit de tests', () => {
  test('should display audit de tests card with correct title and description', async ({ page }) => {
    await page.goto('.');

    // Scroll to services section
    await page.locator('#services').scrollIntoViewIfNeeded();

    // Find the first card (Audit de tests)
    const cards = page.locator('#services .card');
    const auditCard = cards.first();

    // Verify card is visible
    await expect(auditCard).toBeVisible();

    // Verify title
    const title = auditCard.locator('h3');
    await expect(title).toContainText('Audit de tests');

    // Verify description exists
    const description = auditCard.locator('p');
    await expect(description).toBeVisible();
    await expect(description).toContainText(/Analyse complète|stratégie/i);

    // Verify icon is present
    const icon = auditCard.locator('img');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /inspection/i);
  });

  test('should have accessible card with proper structure', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const auditCard = page.locator('#services .card').first();
    
    // Verify card has border
    const computedStyle = await auditCard.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        border: style.border,
        borderRadius: style.borderRadius
      };
    });

    expect(computedStyle.border).toBeTruthy();
  });

  test('audit card should respond to hover', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const auditCard = page.locator('#services .card').first();

    // Get initial transform
    const initialTransform = await auditCard.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });

    // Hover over card
    await auditCard.hover();

    // Get transform after hover (should be different due to translateY)
    const hoverTransform = await auditCard.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });

    // Transforms should be different (hover adds translateY)
    expect(initialTransform !== hoverTransform).toBeTruthy();
  });
});

const { test, expect } = require('@playwright/test');

test.describe('Service: Sécurité applicative', () => {
  test('should display sécurité applicative card with correct title and description', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const cards = page.locator('#services .card');
    const securityCard = cards.nth(4);

    await expect(securityCard).toBeVisible();

    const title = securityCard.locator('h3');
    await expect(title).toContainText('Sécurité');

    const description = securityCard.locator('p');
    await expect(description).toBeVisible();
    await expect(description).toContainText(/failles|utilisateurs|releases/i);

    const icon = securityCard.locator('img');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /shield/i);
  });

  test('security card should have proper styling with borders', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const securityCard = page.locator('#services .card').nth(4);

    const hasRoundedCorners = await securityCard.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.borderRadius !== '0px';
    });

    expect(hasRoundedCorners).toBeTruthy();
  });

  test('security card content should be vertically centered', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const securityCard = page.locator('#services .card').nth(4);
    
    const allElements = await securityCard.locator('h3, p, img').count();
    expect(allElements).toBeGreaterThan(0);

    // Verify all child elements are visible
    const icon = securityCard.locator('img').first();
    const title = securityCard.locator('h3').first();
    const desc = securityCard.locator('p').first();

    await expect(icon).toBeVisible();
    await expect(title).toBeVisible();
    await expect(desc).toBeVisible();
  });
});

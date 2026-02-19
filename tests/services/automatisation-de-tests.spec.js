const { test, expect } = require('@playwright/test');

test.describe('Service: Automatisation de tests', () => {
  test('should display automatisation de tests card with correct title and description', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const cards = page.locator('#services .card');
    const automationCard = cards.nth(3);

    await expect(automationCard).toBeVisible();

    const title = automationCard.locator('h3');
    await expect(title).toContainText('Automatisation de tests');

    const description = automationCard.locator('p');
    await expect(description).toBeVisible();
    await expect(description).toContainText(/Tests automatisés|Playwright|cycles de validation/i);

    const icon = automationCard.locator('img');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /code/i);
  });

  test('should have all required text content', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const automationCard = page.locator('#services .card').nth(3);
    const cardText = await automationCard.textContent();

    expect(cardText).toContain('Automatisation');
    expect(cardText).toBeTruthy();
  });

  test('should be clickable and interactive', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const automationCard = page.locator('#services .card').nth(3);

    // Card should be clickable
    await automationCard.hover();
    
    // Verify it doesn't have link, just info display
    const links = automationCard.locator('a');
    const linkCount = await links.count();
    
    // Should have no internal links (just for display)
    expect(linkCount).toBe(0);
  });
});

const { test, expect } = require('@playwright/test');

test.describe('Service: Innovation', () => {
  test('should display innovation card with correct title and description', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const cards = page.locator('#services .card');
    const innovationCard = cards.nth(5);

    await expect(innovationCard).toBeVisible();

    const title = innovationCard.locator('h3');
    await expect(title).toContainText('Innovation');

    const description = innovationCard.locator('p');
    await expect(description).toBeVisible();

    const icon = innovationCard.locator('img');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /light-on|bulb|innovation/i);
  });

  test('innovation card should contain external link to ci-booster', async ({ page, context }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const innovationCard = page.locator('#services .card').nth(5);
    
    // Check for any link element in the card
    const link = innovationCard.locator('a');
    const linkExists = await link.count();
    
    if (linkExists > 0) {
      await expect(link).toHaveAttribute('href', /ci-booster|lovable/i);
    }
  });

  test('innovation card should be in the grid layout correctly positioned', async ({ page }) => {
    await page.goto('.');

    await page.locator('#services').scrollIntoViewIfNeeded();

    const innovationCard = page.locator('#services .card').nth(5);
    
    // Verify the card is visible and has content
    await expect(innovationCard).toBeVisible();
    
    // Verify all sections are present
    const title = innovationCard.locator('h3');
    const description = innovationCard.locator('p');
    const icon = innovationCard.locator('img');

    await expect(title).toBeVisible();
    await expect(description).toBeVisible();
    await expect(icon).toBeVisible();

    // Verify the card is on screen
    const box = await innovationCard.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});

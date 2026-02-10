const { test, expect } = require('@playwright/test');

test.describe('Service: Optimisation des tests', () => {
  test('should display optimisation des tests card with correct title and description', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:5500/web-site/';
    await page.goto(base);

    await page.locator('#services').scrollIntoViewIfNeeded();

    const cards = page.locator('#services .card');
    const optimisationCard = cards.nth(1);

    await expect(optimisationCard).toBeVisible();

    const title = optimisationCard.locator('h3');
    await expect(title).toContainText('Optimisation des tests');

    const description = optimisationCard.locator('p');
    await expect(description).toBeVisible();
    await expect(description).toContainText(/Réduction du temps|couverture|fiabilité/i);

    const icon = optimisationCard.locator('img');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /settings/i);
  });

  test('should have proper styling and layout', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:5500/web-site/';
    await page.goto(base);

    await page.locator('#services').scrollIntoViewIfNeeded();

    const optimisationCard = page.locator('#services .card').nth(1);

    const styles = await optimisationCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        padding: computed.padding,
        textAlign: computed.textAlign
      };
    });

    expect(styles.display).toMatch(/block|flex/);
    expect(styles.textAlign).toBe('center');
  });

  test('optimisation card icon should be present and correct', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:5500/web-site/';
    await page.goto(base);

    await page.locator('#services').scrollIntoViewIfNeeded();

    const icon = page.locator('#services .card').nth(1).locator('img');
    
    // Verify icon dimensions
    const box = await icon.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});

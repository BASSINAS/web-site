const { test, expect } = require('@playwright/test');

test.describe('Service: CI/CD Automation', () => {
  test('should display CI/CD Automation card with correct title and description', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:5500/web-site/';
    await page.goto(base);

    await page.locator('#services').scrollIntoViewIfNeeded();

    const cards = page.locator('#services .card');
    const cicdCard = cards.nth(2);

    await expect(cicdCard).toBeVisible();

    const title = cicdCard.locator('h3');
    await expect(title).toContainText('CI/CD Automation');

    const description = cicdCard.locator('p');
    await expect(description).toBeVisible();
    await expect(description).toContainText(/Intégration fluide|pipelines|déploiements/i);

    const icon = cicdCard.locator('img');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute('src', /git/i);
  });

  test('should be positioned correctly in services grid', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:5500/web-site/';
    await page.goto(base);

    await page.locator('#services').scrollIntoViewIfNeeded();

    const allCards = page.locator('#services .card');
    const cardCount = await allCards.count();

    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('CI/CD card should have icon and text visibility', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://localhost:5500/web-site/';
    await page.goto(base);

    await page.locator('#services').scrollIntoViewIfNeeded();

    const cicdCard = page.locator('#services .card').nth(2);
    const icon = cicdCard.locator('img');
    const title = cicdCard.locator('h3');
    const description = cicdCard.locator('p');

    // Verify all elements are in viewport
    await expect(icon).toBeInViewport();
    await expect(title).toBeInViewport();
    await expect(description).toBeInViewport();
  });
});

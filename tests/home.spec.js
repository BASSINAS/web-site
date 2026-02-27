const { test, expect } = require('@playwright/test');
const HomePage = require('../library/homePage');
const ServicesPage = require('../library/servicesPage');

test.describe('Site smoke tests', () => {
  test('homepage loads and hero contains core message', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto('.');
    await expect(page).toHaveURL(/http:\/\/localhost:3001\/?$/);
    await home.expectHeroContains('–10% de bugs');
  });

  test('services section has at least 5 cards', async ({ page }) => {
    const home = new HomePage(page);
    const services = new ServicesPage(page);
    await home.goto('.');
    await services.gotoSection();
    await services.expectAtLeastCards(5);
  });
});

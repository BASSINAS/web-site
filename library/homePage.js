const { expect } = require('@playwright/test');

class HomePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heroHeading = 'section.hero h1';
    this.servicesLink = 'a[href="#services"]';
  }

  async goto(baseUrl) {
    await this.page.goto(baseUrl);
  }

  async expectHeroContains(text) {
    await expect(this.page.locator(this.heroHeading)).toContainText(text);
  }

  async goToServices() {
    await this.page.click(this.servicesLink);
  }
}

module.exports = HomePage;

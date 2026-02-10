class ServicesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.sectionSelector = '#services';
    this.cardSelector = '#services .card';
  }

  async gotoSection() {
    await this.page.locator(this.sectionSelector).scrollIntoViewIfNeeded();
  }

  async countServiceCards() {
    return await this.page.locator(this.cardSelector).count();
  }

  async expectAtLeastCards(n) {
    const count = await this.countServiceCards();
    if (count < n) throw new Error(`Expected at least ${n} cards, found ${count}`);
  }
}

module.exports = ServicesPage;

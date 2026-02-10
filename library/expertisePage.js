class ExpertisePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.section = '#expertise';
  }

  async getExpertiseList() {
    return this.page.locator(`${this.section} ul li`);
  }

  async expectAtLeastItems(n) {
    const cnt = await this.getExpertiseList().count();
    if (cnt < n) throw new Error(`Expected at least ${n} expertise items, found ${cnt}`);
  }
}

module.exports = ExpertisePage;

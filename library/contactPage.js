class ContactPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.section = '#contact';
    this.form = '#contact form, #contact form[id]';
    // selectors for the form fields used in our page
    this.name = 'input[name="nom_prenom"]';
    this.email = 'input[name="email"]';
    this.type = 'select[name="type_demande"]';
    this.description = 'textarea[name="description"]';
    this.submit = 'button[type="submit"]';
  }

  async fillBasic({ nom, nom_prenom, email, type_demande, description, telephone, entreprise, stack_technique }) {
    const valueName = nom_prenom || nom;
    if (valueName) await this.page.fill(this.name, valueName);
    if (email) await this.page.fill(this.email, email);
    if (type_demande) await this.page.selectOption(this.type, { label: type_demande });
    if (description) await this.page.fill(this.description, description);
    if (telephone) await this.page.fill('input[name="telephone"]', telephone);
    if (entreprise) await this.page.fill('input[name="entreprise"]', entreprise);
    // select stack_technique if provided, otherwise default to 'JavaScript / Node.js'
    const stackValue = stack_technique || 'JavaScript / Node.js';
    if (stackValue) await this.page.selectOption('select[name="stack_technique"]', { label: stackValue });
  }

  async submitForm() {
    await this.page.click(this.submit);
  }
}

module.exports = ContactPage;

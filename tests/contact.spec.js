const { test, expect } = require('@playwright/test');
const ContactPage = require('../library/contactPage');

test.describe('Contact Section Tests', () => {
  test('contact section displays email, phone, and LinkedIn link', async ({ page }) => {
    await page.goto('.');

    // Scroll to contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Verify email is visible
    const emailLink = page.locator('a[href="mailto:edembassine@gmail.com"]');
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toContainText('edembassine@gmail.com');

    // Verify phone is visible
    const phoneLink = page.locator('a[href="tel:+33769476385"]');
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toContainText('07 69 47 63 85');

    // Verify LinkedIn is a link and visible
    const linkedinLink = page.locator('a[href*="linkedin.com/in/edem-bassine"]');
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toContainText('Voir mon profil');
    // Verify it opens in new tab
    await expect(linkedinLink).toHaveAttribute('target', '_blank');

    // Verify text below is always displayed
    const contactText = page.locator('#contact').locator('text=Je réponds rapidement à toutes vos demandes');
    await expect(contactText).toBeVisible();
  });

  test('audit form fields are visible and have correct types', async ({ page }) => {
    await page.goto('.');

    const contact = new ContactPage(page);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Verify form inputs exist and are visible
    const nomInput = page.locator('input[name="nom_prenom"]');
    await expect(nomInput).toBeVisible();
    await expect(nomInput).toHaveAttribute('placeholder', 'Nom et prénom *');

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Type selector
    const typeSelect = page.locator('select[name="type_demande"]');
    await expect(typeSelect).toBeVisible();
    const options = typeSelect.locator('option');
    const optionsCount = await options.count();
    expect(optionsCount).toBeGreaterThanOrEqual(5);

    // Enterprise field (optional)
    const entrepriseInput = page.locator('input[name="entreprise"]');
    await expect(entrepriseInput).toBeVisible();

    // Stack selector
    const stackSelect = page.locator('select[name="stack_technique"]');
    await expect(stackSelect).toBeVisible();

    // Pain points checkboxes
    const checkboxes = page.locator('input[type="checkbox"][name="douleur"]');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThanOrEqual(5);

    // Description field
    const descriptionField = page.locator('textarea[name="description"]');
    await expect(descriptionField).toBeVisible();

    // Phone field (optional)
    const phoneInput = page.locator('input[name="telephone"]');
    await expect(phoneInput).toBeVisible();

    // Submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText('Envoyer');
  });

  test('form can be filled with audit request data', async ({ page }) => {
    await page.goto('.');

    const contact = new ContactPage(page);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Fill the form
    await contact.fillBasic({
      nom_prenom: 'Jean Dupont',
      email: 'jean@example.com',
      type_demande: 'Audit express 2h',
      entreprise: 'TechCorp',
      stack_technique: 'JavaScript / Node.js',
      description: 'Nous avons besoin d\'un audit de notre infrastructure de tests.',
      telephone: '06 12 34 56 78'
    });

    // Verify values are filled
    await expect(page.locator('input[name="nom_prenom"]')).toHaveValue('Jean Dupont');
    await expect(page.locator('input[name="email"]')).toHaveValue('jean@example.com');
    await expect(page.locator('select[name="type_demande"]')).toHaveValue('Audit express 2h');
    await expect(page.locator('input[name="entreprise"]')).toHaveValue('TechCorp');
    await expect(page.locator('select[name="stack_technique"]')).toHaveValue('JavaScript / Node.js');
    await expect(page.locator('textarea[name="description"]')).toHaveValue(/Nous avons besoin/);
    await expect(page.locator('input[name="telephone"]')).toHaveValue('06 12 34 56 78');
  });

  test('confirmation modal is displayed on form submission', async ({ page }) => {
    await page.goto('.');

    const contact = new ContactPage(page);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Fill form with required fields only
    await contact.fillBasic({
      nom_prenom: 'Test User',
      email: 'test@example.com',
      type_demande: 'Audit express 2h'
    });

    // Modal should be hidden initially
    const modal = page.locator('#confirmationModal');
    await expect(modal).toHaveCSS('display', 'none');

    // Click submit button (but we'll intercept before real submit)
    // Note: In a real scenario, we'd mock the FormSubmit endpoint
    // For now, just verify the modal appears when clicking submit
    const submitBtn = page.locator('button[type="submit"]');
    
    // Prevent form from actually submitting to external service
    await page.evaluate(() => {
      const form = document.getElementById('demandeAuditForm');
      if (form) {
        form.addEventListener('submit', (e) => e.preventDefault(), true);
      }
    });

    await submitBtn.click();

    // Modal should now be visible
    await expect(modal).toBeVisible();
    
    // Verify success message is displayed
    const successIcon = modal.locator('text=✅');
    await expect(successIcon).toBeVisible();
    
    const successMsg = modal.locator('text=Merci !');
    await expect(successMsg).toBeVisible();
    
    const confirmText = modal.locator('text=Votre demande d\'audit a bien été reçue');
    await expect(confirmText).toBeVisible();
  });

  test('form fields are reset after form clear', async ({ page }) => {
    await page.goto('.');

    const contact = new ContactPage(page);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Fill form with test data
    await contact.fillBasic({
      nom_prenom: 'John Doe',
      email: 'john@example.com',
      type_demande: 'Optimisation des tests',
      entreprise: 'MyCompany',
      description: 'Test description'
    });

    // Verify form is filled
    await expect(page.locator('input[name="nom_prenom"]')).toHaveValue('John Doe');
    await expect(page.locator('input[name="email"]')).toHaveValue('john@example.com');

    // Reset the form programmatically (simulating what happens after submission)
    await page.evaluate(() => {
      const form = document.getElementById('demandeAuditForm');
      if (form) form.reset();
    });

    // Verify form fields are now empty
    await expect(page.locator('input[name="nom_prenom"]')).toHaveValue('');
    await expect(page.locator('input[name="email"]')).toHaveValue('');
    await expect(page.locator('input[name="entreprise"]')).toHaveValue('');
    await expect(page.locator('textarea[name="description"]')).toHaveValue('');
  });
});

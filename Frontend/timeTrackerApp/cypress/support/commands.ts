declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      selectMatOption(label: string): Chainable<void>;
      selectCompany(name: string): Chainable<void>;
      pickToday(formControlName: string): Chainable<void>;
      confirmDialog(): Chainable<void>;
      deleteViaApi(path: string, id: number): Chainable<void>;
    }
  }
}

// Cypress.env read overloads are deprecated in newer type definitions but the
// runtime API is stable. Cast through unknown to silence the TS hint.
const cypressEnv = (Cypress as unknown as { env: () => Record<string, string> }).env();

// Login using session cache — only hits the login page once per session key
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const _email = email ?? cypressEnv['email'];
  const _password = password ?? cypressEnv['password'];

  cy.session(
    [_email, _password],
    () => {
      cy.visit('/auth/login');
      cy.get('input[formcontrolname="email"]').type(_email);
      // force:true — mat-icon suffix is detected as covering the input
      cy.get('input[formcontrolname="password"]').type(_password, { force: true });
      cy.contains('button', 'ingresar').click();
      cy.url().should('include', '/dashboard');
    },
    {
      validate() {
        cy.window().its('localStorage').invoke('getItem', 'token').should('be.a', 'string');
      },
    }
  );
});

// Click a mat-option whose visible text matches label
Cypress.Commands.add('selectMatOption', (label: string) => {
  cy.get('mat-option').contains(label).click();
});

// Select active company via sidebar mat-select.
// cy.session restores initial login state (no selectedCompany), so call this
// at the start of any test that requires an active company.
Cypress.Commands.add('selectCompany', (name: string) => {
  cy.get('.selector-container mat-select').click();
  cy.get('mat-option').contains(name).click();
  cy.get('.selector-container mat-select').should('contain.text', name);
});

// Set today's date on a Material datepicker input.
// Types directly into the input (MM/DD/YYYY — what Date.parse accepts in Chrome)
// then presses Tab to close any open calendar and trigger Angular's validation.
// Avoids all CDK overlay click-propagation issues.
Cypress.Commands.add('pickToday', (formControlName: string) => {
  const d  = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = `${mm}/${dd}/${d.getFullYear()}`; // e.g. 04/28/2026

  cy.get(`mat-dialog-container input[formcontrolname="${formControlName}"]`)
    .click({ force: true })
    .type(dateStr, { force: true })
    .blur();

  cy.get('mat-datepicker-content').should('not.exist');
});

// Confirm the shared ConfirmDialogComponent
Cypress.Commands.add('confirmDialog', () => {
  cy.get('mat-dialog-container').contains('button', 'Confirmar').click();
});

// DELETE request authenticated with the token from localStorage
Cypress.Commands.add('deleteViaApi', (path: string, id: number) => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    const apiUrl = cypressEnv['apiUrl'];
    cy.request({
      method: 'DELETE',
      url: `${apiUrl}/api/${path}/${id}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
  });
});

export {};

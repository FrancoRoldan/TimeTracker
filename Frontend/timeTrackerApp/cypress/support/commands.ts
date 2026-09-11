declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      refreshAuthToken(): Chainable<void>;
      selectMatOption(label: string): Chainable<void>;
      selectCompany(name: string): Chainable<void>;
      pickToday(formControlName: string): Chainable<void>;
      confirmDialog(): Chainable<void>;
      deleteViaApi(path: string, id: number): Chainable<void>;
    }
  }
}


const cypressEnv = (Cypress as unknown as { env: () => Record<string, string> }).env();


Cypress.Commands.add('login', (email?: string, password?: string) => {
  const _email = email ?? cypressEnv['email'];
  const _password = password ?? cypressEnv['password'];

  cy.session(
    [_email, _password, 'v2'],
    () => {
      cy.visit('/auth/login');
      cy.get('input[formcontrolname="email"]').type(_email);
      cy.get('input[formcontrolname="password"]').type(_password, { force: true });
      cy.contains('button', 'ingresar').click();
      cy.url().should('include', '/dashboard');
      cy.window().then((win) => win.localStorage.removeItem('selectedCompany'));
    },
    {
      validate() {
        cy.window().its('localStorage').invoke('getItem', 'token').should('be.a', 'string');
      },
    }
  );
});


Cypress.Commands.add('refreshAuthToken', () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('token') ?? '';
    const apiUrl = cypressEnv['apiUrl'];
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/refresh`,
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ body }) => {
      win.localStorage.setItem('token', body.token);
    });
  });
});


Cypress.Commands.add('selectMatOption', (label: string) => {
  cy.get('mat-option').contains(label).click();
});


Cypress.Commands.add('selectCompany', (name: string) => {
  cy.get('.selector-container mat-select').click();
  cy.get('mat-option').contains(name).click();
  cy.get('.selector-container mat-select').should('contain.text', name);
});


Cypress.Commands.add('pickToday', (formControlName: string) => {
  const d  = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = `${mm}/${dd}/${d.getFullYear()}`; // e.g. 04/28/2026

  cy.get(`mat-dialog-container input[formcontrolname="${formControlName}"]`)
    .click({ force: true })
    .type(dateStr, { force: true });


  cy.get('body').then(($body) => {
    if ($body.find('.mat-overlay-transparent-backdrop').length) {
      cy.get('.mat-overlay-transparent-backdrop').click({ force: true });
    } else {
      cy.get('mat-dialog-container').click({ force: true });
    }
  });

  cy.get('mat-datepicker-content').should('not.exist');
  cy.get(`mat-dialog-container input[formcontrolname="${formControlName}"]`)
    .should('not.have.value', '');
});


Cypress.Commands.add('confirmDialog', () => {
  cy.get('mat-dialog-container').contains('button', 'Confirmar').click();
});


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

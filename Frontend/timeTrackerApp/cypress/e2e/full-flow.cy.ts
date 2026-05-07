/**
 * Full E2E flow:
 *   login → create 2 companies → select company A (via list) →
 *   select company A (via sidebar) → create project →
 *   create issue → add manual time entry →
 *   verify company isolation → switch back → cleanup via API
 *
 * WHY cy.selectCompany is called before each resource-creation test:
 *   cy.session() restores the initial login snapshot which has no
 *   selectedCompany in localStorage. CompanyService reads it from
 *   localStorage on init, so after every beforeEach the active company
 *   is null and "Crear proyecto" is disabled. Each test that needs an
 *   active company must explicitly select one.
 *
 * Dates are selected via the Material calendar picker (cy.pickToday) to
 * avoid all locale/Date.parse format issues.
 *
 * Credentials and URLs: cypress.env.json (gitignored).
 * Run: npx cypress open  |  npx cypress run --headless
 */

const ts = Date.now().toString().slice(-6);

// Derive a unique 2-hour window from ts so concurrent/repeated runs don't
// hit the backend's per-user overlap guard (which is not company-scoped).
const _startHour = parseInt(ts) % 22; // 0–21, keeps endHour ≤ 23
const _pad = (n: number) => String(n).padStart(2, '0');

const TEST_DATA = {
  companyA:  { name: `Omega Corp ${ts}`,  code: `OMEGA${ts}` },
  companyB:  { name: `Delta Inc ${ts}`,   code: `DELTA${ts}` },
  project:   { name: `Phoenix Project ${ts}` },
  issue:     { title: `Critical Login Bug ${ts}` },
  timeEntry: {
    description: `E2E implementation work ${ts}`,
    startTime:   `${_pad(_startHour)}:00`,
    endTime:     `${_pad(_startHour + 2)}:00`,
  },
};

const ids = { companyA: 0, companyB: 0, project: 0, issue: 0, timeEntry: 0 };

// Opens a mat-select inside the open dialog (overlay renders outside dialog so
// we call this OUTSIDE cy.within() blocks)
function openDialogSelect(formControlName: string): void {
  cy.get(`mat-dialog-container mat-select[formcontrolname="${formControlName}"]`).click();
}

// Bypass deprecated Cypress.env(key) overload
const cypressEnv = (Cypress as unknown as { env: () => Record<string, string> }).env();

// ─────────────────────────────────────────────────────────────────────────────

describe('TimeTracker – Full E2E Flow', () => {

  beforeEach(() => {
    cy.login();
    // Re-issue JWT so companyIds[] in claims includes companies created during
    // this run. cy.session() restores the original login token which doesn't
    // know about companies created after that snapshot.
    cy.refreshAuthToken();
  });

  // ── 1. Login ─────────────────────────────────────────────────────────────

  it('redirects to dashboard after login', () => {
    cy.visit('/');
    cy.url().should('include', '/dashboard');
  });

  // ── 2. Create Company A ──────────────────────────────────────────────────

  it('creates company A', () => {
    cy.intercept('POST', '**/company').as('createCompanyA');

    cy.visit('/companies');
    cy.contains('button', 'Crear empresa').click();

    cy.get('mat-dialog-container').within(() => {
      cy.get('input[formcontrolname="name"]').type(TEST_DATA.companyA.name);
      cy.get('input[formcontrolname="code"]').type(TEST_DATA.companyA.code);
      cy.contains('button', 'Crear').click();
    });

    cy.wait('@createCompanyA').then(({ response }) => {
      ids.companyA = response!.body.id;
    });
    cy.contains('mat-card-title', TEST_DATA.companyA.name).should('be.visible');
  });

  // ── 3. Create Company B ──────────────────────────────────────────────────

  it('creates company B', () => {
    cy.intercept('POST', '**/company').as('createCompanyB');

    cy.visit('/companies');
    cy.contains('button', 'Crear empresa').click();

    cy.get('mat-dialog-container').within(() => {
      cy.get('input[formcontrolname="name"]').type(TEST_DATA.companyB.name);
      cy.get('input[formcontrolname="code"]').type(TEST_DATA.companyB.code);
      cy.contains('button', 'Crear').click();
    });

    cy.wait('@createCompanyB').then(({ response }) => {
      ids.companyB = response!.body.id;
    });
    cy.contains('mat-card-title', TEST_DATA.companyB.name).should('be.visible');
  });

  // ── 4. Select Company A via company list ─────────────────────────────────
  // Tests the "Seleccionar" button on the company card specifically.

  it('selects company A as active via company list', () => {
    cy.visit('/companies');

    cy.contains('mat-card-title', TEST_DATA.companyA.name)
      .closest('mat-card')
      .contains('button', 'Seleccionar')
      .click();

    cy.get('.selector-container mat-select')
      .should('contain.text', TEST_DATA.companyA.name);
  });

  // ── 5. Create Project under Company A ────────────────────────────────────
  // Must re-select company — cy.session restores login snapshot (no active company).

  it('creates a project under company A', () => {
    cy.intercept('POST', '**/project').as('createProject');

    cy.visit('/projects');
    cy.selectCompany(TEST_DATA.companyA.name);

    cy.contains('button', 'Crear proyecto').should('not.be.disabled').click();

    cy.get('mat-dialog-container').within(() => {
      cy.get('input[formcontrolname="name"]').type(TEST_DATA.project.name);
    });

    openDialogSelect('status');
    cy.selectMatOption('Activo');

    cy.pickToday('startDate');

    cy.get('mat-dialog-container').within(() => {
      cy.contains('button', 'Crear').click();
    });

    cy.wait('@createProject').then(({ response }) => {
      ids.project = response!.body.id;
    });
    cy.contains(TEST_DATA.project.name).should('be.visible');
  });

  // ── 6. Create Issue inside the Project ───────────────────────────────────

  it('creates an issue under the project', () => {
    cy.intercept('POST', '**/issue').as('createIssue');

    cy.visit(`/projects/${ids.project}/issues`);
    cy.selectCompany(TEST_DATA.companyA.name);

    cy.contains('button', 'Nueva incidencias').click();

    cy.get('mat-dialog-container').within(() => {
      cy.get('input[formcontrolname="title"]').type(TEST_DATA.issue.title);
    });

    openDialogSelect('type');
    cy.selectMatOption('Tarea');

    openDialogSelect('status');
    cy.selectMatOption('En análisis');

    openDialogSelect('priority');
    cy.selectMatOption('Media');

    cy.get('mat-dialog-container').contains('button', 'Crear').click();

    cy.wait('@createIssue').then(({ response }) => {
      ids.issue = response!.body.id;
    });
    cy.contains(TEST_DATA.issue.title).should('be.visible');
  });

  // ── 7. Add Manual Time Entry ─────────────────────────────────────────────

  it('adds a manual time entry', () => {
    cy.intercept('POST', '**/time/manual').as('createTimeEntry');

    cy.visit('/time-entries');
    cy.selectCompany(TEST_DATA.companyA.name);

    cy.contains('button', 'Nuevo registro').click();

    openDialogSelect('projectId');
    cy.selectMatOption(TEST_DATA.project.name);

    cy.get('mat-dialog-container').within(() => {
      cy.get('textarea[formcontrolname="description"]').type(TEST_DATA.timeEntry.description);
    });

    cy.pickToday('startDate');

    cy.get('mat-dialog-container').within(() => {
      cy.get('input[formcontrolname="startTime"]').type(TEST_DATA.timeEntry.startTime);
      cy.get('input[formcontrolname="endTime"]').type(TEST_DATA.timeEntry.endTime);
      cy.contains('button', 'Crear').click();
    });

    cy.wait('@createTimeEntry').then(({ response }) => {
      ids.timeEntry = response!.body.id;
    });
    cy.contains(TEST_DATA.timeEntry.description).should('be.visible');
  });

  // ── 8. Switch to Company B – verify tenant isolation ─────────────────────

  it('switches to company B and verifies no company A projects', () => {
    cy.visit('/projects');
    cy.selectCompany(TEST_DATA.companyB.name);

    cy.contains('mat-card-title', TEST_DATA.project.name).should('not.exist');
  });

  // ── 9. Switch back to Company A ──────────────────────────────────────────

  it('switches back to company A and sees the project again', () => {
    cy.visit('/projects');

    cy.selectCompany(TEST_DATA.companyB.name);  // start from B to test the switch
    cy.selectCompany(TEST_DATA.companyA.name);

    cy.contains('mat-card-title', TEST_DATA.project.name).should('be.visible');
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────

  after(() => {
    cy.window().then((win) => {
      const token   = win.localStorage.getItem('token');
      const apiUrl  = cypressEnv['apiUrl'];
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const del = (path: string, id: number) => {
        if (!id) return;
        cy.request({ method: 'DELETE', url: `${apiUrl}/api/${path}/${id}`, headers, failOnStatusCode: false });
      };

      del('time',    ids.timeEntry);
      del('issue',   ids.issue);
      del('project', ids.project);
      del('company', ids.companyA);
      del('company', ids.companyB);
    });
  });
});

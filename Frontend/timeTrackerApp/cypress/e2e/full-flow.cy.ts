/**
 * Flujo E2E completo:
 *   iniciar sesión → crear 2 empresas → seleccionar la empresa A (desde la lista) →
 *   seleccionar la empresa A (desde la barra lateral) → crear proyecto →
 *   crear incidencia → añadir registro de tiempo manual →
 *   verificar el aislamiento entre empresas → volver a cambiar → limpiar mediante la API
 *
 * POR QUÉ se llama a cy.selectCompany antes de cada prueba de creación de recursos:
 *   cy.session() restaura la sesión inicial de inicio de sesión, que no tiene
 *   selectedCompany en localStorage. CompanyService lo lee de
 *   localStorage al inicializarse, por lo que después de cada beforeEach la
 *   empresa activa es null y "Crear proyecto" está deshabilitado. Cada prueba
 *   que necesita una empresa activa debe seleccionar una explícitamente.
 *
 * Las fechas se seleccionan mediante el selector de calendario de Material
 * (cy.pickToday) para evitar problemas de formato con la configuración regional
 * y Date.parse.
 *
 * Credenciales y URLs: cypress.env.json (ignorado por Git).
 * Ejecutar: npx cypress open  |  npx cypress run --headless
 */

const ts = Date.now().toString().slice(-6);


const _startHour = parseInt(ts) % 22; // 0–21, mantiena la hora final ≤ 23
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


function openDialogSelect(formControlName: string): void {
  cy.get(`mat-dialog-container mat-select[formcontrolname="${formControlName}"]`).click();
}


const cypressEnv = (Cypress as unknown as { env: () => Record<string, string> }).env();

// ─────────────────────────────────────────────────────────────────────────────

describe('TimeTracker – Full E2E Flow', () => {

  beforeEach(() => {
    cy.login();
    cy.refreshAuthToken();
  });

  // ── 1. Login ─────────────────────────────────────────────────────────────

  it('redirects to dashboard after login', () => {
    cy.visit('/');
    cy.url().should('include', '/dashboard');
  });

  // ── 2. Crear Empresa A ──────────────────────────────────────────────────

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

  // ── 3. Crear Empresa B ──────────────────────────────────────────────────

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

  // ── 4. Seleccionar Empresa A ─────────────────────────────────
  // Prueba el seleccionar.

  it('selects company A as active via company list', () => {
    cy.visit('/companies');

    cy.contains('mat-card-title', TEST_DATA.companyA.name)
      .closest('mat-card')
      .contains('button', 'Seleccionar')
      .click();

    cy.get('.selector-container mat-select')
      .should('contain.text', TEST_DATA.companyA.name);
  });

  // ── 5. Crear Proyecto bajo Empresa A ────────────────────────────────────

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

  // ── 6. Crear Incidencia dentro del Proyecto ───────────────────────────────────

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

  // ── 7. Agregar Entrada de Tiempo Manual ─────────────────────────────────────────────

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

  // ── 8. Cambiar a Empresa B – comprobar isolation de tenant ─────────────────────

  it('switches to company B and verifies no company A projects', () => {
    cy.visit('/projects');
    cy.selectCompany(TEST_DATA.companyB.name);

    cy.contains('mat-card-title', TEST_DATA.project.name).should('not.exist');
  });

  // ── 9. Cambiar a Empresa A ──────────────────────────────────────────

  it('switches back to company A and sees the project again', () => {
    cy.visit('/projects');

    cy.selectCompany(TEST_DATA.companyB.name);  
    cy.selectCompany(TEST_DATA.companyA.name);

    cy.contains('mat-card-title', TEST_DATA.project.name).should('be.visible');
  });

  // ── Limpieza ───────────────────────────────────────────────────────────────

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

# Documentación Detallada - Frontend Angular TimeTracker

## 📑 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Configuración Inicial](#configuración-inicial)
4. [Módulos Principales](#módulos-principales)
5. [Servicios](#servicios)
6. [Componentes](#componentes)
7. [Guardias de Rutas](#guardias-de-rutas)
8. [Interceptores](#interceptores)
9. [Interfaces de Datos](#interfaces-de-datos)
10. [Pipes Personalizados](#pipes-personalizados)
11. [Enumeraciones](#enumeraciones)
12. [Configuración de Entorno](#configuración-de-entorno)
13. [Temas y Estilos](#temas-y-estilos)

---

## 📌 Descripción General

**Frontend TimeTracker** es una aplicación Angular 19 con soporte para:

- 🔐 Autenticación con JWT
- 🏢 Gestión Multi-Tenant
- 📊 Dashboard y Reportes
- ⏱️ Seguimiento de Tiempo en Tiempo Real
- 🎨 Tema Material Design (Light/Dark)
- 📱 Diseño Responsive
- ♿ Accesibilidad

**Stack Tecnológico:**

- Angular 19
- Angular Material 19
- RxJS 7.8
- Chart.js 4.4.7
- Moment.js 2.30.1
- TypeScript 5.5

---

## 📂 Estructura de Carpetas

```
Frontend/timeTrackerApp/src/
│
├── app/                            # Aplicación principal
│   ├── app.component.ts            # Componente raíz
│   ├── app.config.ts               # Configuración de la aplicación
│   ├── app.routes.ts               # Rutas principales
│   │
│   ├── auth/                       # Módulo de Autenticación
│   │   ├── auth.routes.ts
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── login.component.html
│   │   │   │   └── login.component.css
│   │   │   ├── register/
│   │   │   │   ├── register.component.ts
│   │   │   │   ├── register.component.html
│   │   │   │   └── register.component.css
│   │   │   └── LayoutLogin.component.ts
│   │   ├── services/
│   │   │   └── auth.service.ts     # Servicio de autenticación
│   │   └── interfaces/
│   │       ├── login-request.interface.ts
│   │       ├── login-response.interface.ts
│   │       ├── register-request.interface.ts
│   │       ├── user.interface.ts
│   │       ├── refresh-token-response.interface.ts
│   │       └── user-company-info.interface.ts
│   │
│   ├── company/                    # Módulo de Empresas
│   │   ├── components/
│   │   │   ├── company-list/
│   │   │   ├── company-modal/
│   │   │   ├── company-card/
│   │   │   └── company-users/
│   │   ├── services/
│   │   │   └── company.service.ts
│   │   ├── interfaces/
│   │   │   ├── company.interface.ts
│   │   │   ├── create-company-request.interface.ts
│   │   │   └── update-company-request.interface.ts
│   │   └── company.routes.ts
│   │
│   ├── project/                    # Módulo de Proyectos
│   │   ├── components/
│   │   │   ├── project-list/
│   │   │   ├── project-modal/
│   │   │   ├── project-card/
│   │   │   └── project-detail/
│   │   ├── services/
│   │   │   └── project.service.ts
│   │   ├── interfaces/
│   │   │   ├── project.interface.ts
│   │   │   ├── create-project-request.interface.ts
│   │   │   └── update-project-request.interface.ts
│   │   └── project.routes.ts
│   │
│   ├── issue/                      # Módulo de Issues
│   │   ├── components/
│   │   │   ├── issue-list/
│   │   │   ├── issue-modal/
│   │   │   ├── issue-card/
│   │   │   └── issue-detail/
│   │   ├── services/
│   │   │   └── issue.service.ts
│   │   ├── interfaces/
│   │   │   ├── issue.interface.ts
│   │   │   ├── create-issue-request.interface.ts
│   │   │   └── update-issue-request.interface.ts
│   │   └── issue.routes.ts
│   │
│   ├── time-entry/                 # Módulo de Seguimiento de Tiempo
│   │   ├── components/
│   │   │   ├── time-tracker/       # Cronómetro en vivo
│   │   │   │   ├── time-tracker.component.ts
│   │   │   │   ├── time-tracker.component.html
│   │   │   │   └── time-tracker.component.css
│   │   │   ├── time-entry-list/    # Lista de registros
│   │   │   ├── time-entry-modal/   # Modal para crear/editar
│   │   │   └── timer-display/
│   │   ├── services/
│   │   │   └── time-entry.service.ts
│   │   ├── interfaces/
│   │   │   ├── time-entry.interface.ts
│   │   │   ├── create-time-entry-request.interface.ts
│   │   │   └── start-timer-request.interface.ts
│   │   └── time-entry.routes.ts
│   │
│   ├── reports/                    # Módulo de Reportes
│   │   ├── components/
│   │   │   ├── user-report/
│   │   │   ├── project-report/
│   │   │   ├── company-report/
│   │   │   └── report-filters/
│   │   ├── shared/
│   │   │   ├── line-chart/
│   │   │   ├── bar-chart/
│   │   │   ├── pie-chart/
│   │   │   └── doughnut-chart/
│   │   ├── services/
│   │   │   └── reports.service.ts
│   │   ├── interfaces/
│   │   │   ├── user-report.interface.ts
│   │   │   ├── project-report.interface.ts
│   │   │   └── company-report.interface.ts
│   │   └── reports.routes.ts
│   │
│   ├── dashboard/                  # Dashboard Principal
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.css
│   │
│   ├── core/                       # Servicios Core
│   │   ├── enums/
│   │   │   └── user-role.enum.ts
│   │   ├── services/
│   │   │   ├── api.service.ts      # Base para llamadas HTTP
│   │   │   └── [más servicios]
│   │   └── interceptors/
│   │
│   ├── shared/                     # Componentes y Servicios Compartidos
│   │   ├── components/
│   │   │   ├── layout.component.ts         # Layout principal
│   │   │   ├── left-side-bar/              # Navegación
│   │   │   ├── right-side-bar/             # Configuración
│   │   │   ├── floating-timer-button/      # Botón flotante
│   │   │   ├── error-dialog/               # Diálogo de errores
│   │   │   ├── confirm-dialog-component/   # Confirmación
│   │   │   ├── start-timer-modal/          # Modal de inicio de timer
│   │   │   ├── buttons-theme/              # Selector de tema
│   │   │   ├── not-found/                  # Página 404
│   │   │   └── [más componentes]
│   │   ├── services/
│   │   │   ├── auth.service.ts             # (ver auth/)
│   │   │   ├── login-interceptor.interceptor.ts
│   │   │   ├── toast.service.ts            # Notificaciones
│   │   │   ├── theme-service.service.ts    # Temas
│   │   │   ├── keyboard-shortcut.service.ts
│   │   │   ├── audio.service.ts            # Sonidos
│   │   │   └── spanish-paginator-intl.service.ts
│   │   ├── pipes/
│   │   │   └── enum-label.pipe.ts          # Convierte enums a labels
│   │   ├── interfaces/
│   │   │   ├── paginated-response.interface.ts
│   │   │   └── menu.interface.ts
│   │   ├── layouts/
│   │   │   └── layout.component.ts
│   │   └── utils/
│   │       └── [funciones auxiliares]
│   │
│   ├── guards/                     # Guardias de Rutas
│   │   ├── auth.guard.ts           # Protege rutas autenticadas
│   │   └── is-authenticated.guard.ts
│   │
│   └── [módulos con rutas]
│
├── environments/                   # Configuración por entorno
│   ├── environment.ts              # Producción
│   └── environment.development.ts  # Desarrollo
│
├── main.ts                         # Punto de entrada
├── index.html
├── styles.css                      # Estilos globales
│
├── public/                         # Archivos estáticos
│   ├── themes/                     # Temas CSS
│   └── assets/
│
└── [archivos de configuración]
    ├── angular.json
    ├── tsconfig.app.json
    ├── tsconfig.json
    └── package.json
```

---

## ⚙️ Configuración Inicial

### app.config.ts

Configuración principal de la aplicación:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter, withViewTransitions } from "@angular/router";
import { routes } from "./app.routes";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideNativeDateAdapter } from "@angular/material/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { LoginInterceptor } from "./shared/services/login-interceptor.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    // Cambio de detección de zona
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Rutas con transiciones de vista
    provideRouter(routes, withViewTransitions()),

    // Animaciones Angular
    provideAnimationsAsync(),

    // Adaptador de fechas nativo
    provideNativeDateAdapter(),

    // HTTP Client con interceptor
    provideHttpClient(withInterceptors([LoginInterceptor])),
  ],
};
```

**Configuración Incluida:**

- ✅ Routing con lazy-loading
- ✅ Animaciones de vistas
- ✅ Material Design integrado
- ✅ HTTP Interceptors
- ✅ Detección de cambios optimizada

### app.routes.ts

Definición de rutas principales:

```typescript
import { Routes } from "@angular/router";
import { LayoutComponent } from "./shared/layouts/layout.component";
import { AuthGuard } from "./guards/auth.guard";
import { IsAuthenticatedGuard } from "./guards/is-authenticated.guard";

export const routes: Routes = [
  {
    path: "auth",
    canActivate: [IsAuthenticatedGuard],
    loadChildren: () => import("./auth/auth.routes").then((m) => m.routes),
  },
  {
    path: "",
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./dashboard/dashboard.component").then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: "company",
        loadChildren: () =>
          import("./company/company.routes").then((m) => m.routes),
      },
      {
        path: "project",
        loadChildren: () =>
          import("./project/project.routes").then((m) => m.routes),
      },
      {
        path: "issue",
        loadChildren: () =>
          import("./issue/issue.routes").then((m) => m.routes),
      },
      {
        path: "time-entry",
        loadChildren: () =>
          import("./time-entry/time-entry.routes").then((m) => m.routes),
      },
      {
        path: "reports",
        loadChildren: () =>
          import("./reports/reports.routes").then((m) => m.routes),
      },
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
    ],
  },
  {
    path: "**",
    component: NotFoundComponent,
  },
];
```

**Estructura de Rutas:**

```
/auth (login, register) - Sin protección
/dashboard              - Protegido por AuthGuard
/company               - Protegido por AuthGuard
/project               - Protegido por AuthGuard
/issue                 - Protegido por AuthGuard
/time-entry            - Protegido por AuthGuard
/reports               - Protegido por AuthGuard
```

---

## 🎯 Módulos Principales

### 1. Módulo de Autenticación (auth/)

#### AuthService

Gestiona toda la lógica de autenticación:

```typescript
@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private urlApi: string = environment.baseUrl;

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Login del usuario
   */
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.urlApi}/auth/login`, req).pipe(
      tap((res) => {
        this.saveTokenLocalStorage(res.token);
        this.userSubject.next(res.user);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("companies", JSON.stringify(res.companies));
        localStorage.setItem(
          "selectedCompany",
          JSON.stringify(res.companies[0])
        );
      })
    );
  }

  /**
   * Registro de nuevo usuario
   */
  register(req: RegisterRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.urlApi}/auth/register`, req)
      .pipe(
        tap((res) => {
          this.saveTokenLocalStorage(res.token);
          this.userSubject.next(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
          localStorage.setItem("companies", JSON.stringify(res.companies));
        })
      );
  }

  /**
   * Refresca el token JWT
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const headers = {
      authorization: `Bearer ${this.getTokenLocalStorage() ?? ""}`,
    };
    return this.http
      .post<RefreshTokenResponse>(`${this.urlApi}/auth/refresh`, null, {
        headers,
      })
      .pipe(tap((newToken) => this.saveTokenLocalStorage(newToken.token)));
  }

  /**
   * Cierra la sesión
   */
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("companies");
    localStorage.removeItem("selectedCompany");
    this.userSubject.next(null);
    this.router.navigate(["auth"]);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getTokenLocalStorage();
  }

  /**
   * Obtiene el usuario actual
   */
  get user(): User | null {
    return this.userSubject.value;
  }

  // ===== GESTIÓN DE TOKEN =====

  /**
   * Guarda token en localStorage
   */
  saveTokenLocalStorage(token: string): void {
    localStorage.setItem("token", token);
  }

  /**
   * Obtiene token del localStorage
   */
  getTokenLocalStorage(): string | null {
    return localStorage.getItem("token");
  }

  // ===== GESTIÓN DE ROLES (Multi-Tenant) =====

  /**
   * Establece el rol del usuario en la empresa seleccionada
   */
  setUserRoleInCompany(companyId: number, role: UserRole): void {
    localStorage.setItem("userRole", role);
    localStorage.setItem("companyId", companyId.toString());
  }

  /**
   * Obtiene el rol del usuario en la empresa actual
   */
  getUserRole(): UserRole | undefined {
    const role = localStorage.getItem("userRole");
    return role as UserRole | undefined;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasRole(roles: UserRole[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }
}
```

**Almacenamiento LocalStorage:**

```
- token          : JWT token
- user           : Objeto usuario
- companies      : Lista de empresas del usuario
- selectedCompany: Empresa actualmente seleccionada
- userRole       : Rol en la empresa actual
- companyId      : ID de la empresa actual
```

#### LoginComponent

Formulario de login:

```typescript
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe(
      () => {
        this.router.navigate(["/dashboard"]);
      },
      (error) => {
        this.loading = false;
        console.error(error);
      }
    );
  }
}
```

---

### 2. Módulo de Empresa (company/)

#### CompanyService

Gestión de empresas:

```typescript
@Injectable({ providedIn: "root" })
export class CompanyService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private urlApi = environment.baseUrl;

  // State management con BehaviorSubject
  private companiesSubject = new BehaviorSubject<Company[]>([]);
  public companies$ = this.companiesSubject.asObservable();

  private selectedCompanySubject = new BehaviorSubject<Company | null>(null);
  public selectedCompany$ = this.selectedCompanySubject.asObservable();

  // ===== MÉTODOS =====

  /**
   * Obtiene todas las empresas del usuario
   */
  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.urlApi}/company`).pipe(
      tap((companies) => this.companiesSubject.next(companies)),
      catchError((error) => {
        console.error("Error fetching companies:", error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene una empresa por ID
   */
  getCompanyById(id: number): Observable<Company> {
    return this.http
      .get<Company>(`${this.urlApi}/company/${id}`)
      .pipe(tap((company) => this.selectedCompanySubject.next(company)));
  }

  /**
   * Crea una nueva empresa
   */
  createCompany(data: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(`${this.urlApi}/company`, data).pipe(
      tap((company) => {
        const current = this.companiesSubject.value;
        this.companiesSubject.next([...current, company]);
      })
    );
  }

  /**
   * Actualiza una empresa
   */
  updateCompany(id: number, data: UpdateCompanyRequest): Observable<Company> {
    return this.http.put<Company>(`${this.urlApi}/company/${id}`, data).pipe(
      tap((company) => {
        const current = this.companiesSubject.value;
        const updated = current.map((c) => (c.id === id ? company : c));
        this.companiesSubject.next(updated);
      })
    );
  }

  /**
   * Elimina una empresa
   */
  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlApi}/company/${id}`).pipe(
      tap(() => {
        const current = this.companiesSubject.value;
        this.companiesSubject.next(current.filter((c) => c.id !== id));
      })
    );
  }

  /**
   * Obtiene usuarios de una empresa
   */
  getCompanyUsers(companyId: number): Observable<CompanyUser[]> {
    return this.http.get<CompanyUser[]>(
      `${this.urlApi}/company/${companyId}/users`
    );
  }

  /**
   * Agrega usuario a empresa
   */
  addUserToCompany(
    companyId: number,
    request: AddUserToCompanyRequest
  ): Observable<void> {
    return this.http.post<void>(
      `${this.urlApi}/company/${companyId}/add-user`,
      request
    );
  }

  /**
   * Remueve usuario de empresa
   */
  removeUserFromCompany(companyId: number, userId: number): Observable<void> {
    return this.http.post<void>(
      `${this.urlApi}/company/${companyId}/remove-user`,
      { userId }
    );
  }

  /**
   * Obtiene empresa seleccionada
   */
  getSelectedCompany(): Company | null {
    return this.selectedCompanySubject.value;
  }

  /**
   * Establece empresa seleccionada
   */
  setSelectedCompany(company: Company): void {
    this.selectedCompanySubject.next(company);
    localStorage.setItem("selectedCompany", JSON.stringify(company));
  }
}
```

**Manejo de Estado:**

- Usa `BehaviorSubject` para estado reactivo
- Actualiza estado al realizar operaciones
- Proporciona observables para componentes

---

### 3. Módulo de Seguimiento de Tiempo (time-entry/)

#### TimeEntryService

```typescript
@Injectable({ providedIn: "root" })
export class TimeEntryService {
  private http = inject(HttpClient);
  private urlApi = environment.baseUrl;

  // Estado del cronómetro
  private timerRunningSubject = new BehaviorSubject<boolean>(false);
  public timerRunning$ = this.timerRunningSubject.asObservable();

  private currentTimeEntrySubject = new BehaviorSubject<TimeEntry | null>(null);
  public currentTimeEntry$ = this.currentTimeEntrySubject.asObservable();

  /**
   * Inicia cronómetro
   */
  startTimer(request: StartTimerRequest): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(`${this.urlApi}/time/start`, request).pipe(
      tap((entry) => {
        this.timerRunningSubject.next(true);
        this.currentTimeEntrySubject.next(entry);
      })
    );
  }

  /**
   * Detiene cronómetro
   */
  stopTimer(id: number): Observable<TimeEntry> {
    return this.http
      .post<TimeEntry>(`${this.urlApi}/time/stop/${id}`, null)
      .pipe(
        tap((entry) => {
          this.timerRunningSubject.next(false);
          this.currentTimeEntrySubject.next(null);
        })
      );
  }

  /**
   * Crea registro de tiempo manual
   */
  createTimeEntry(request: CreateTimeEntryRequest): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(`${this.urlApi}/time`, request);
  }

  /**
   * Obtiene registros de tiempo
   */
  getTimeEntries(filters: TimeEntryFilter): Observable<TimeEntry[]> {
    let params = new HttpParams();
    if (filters.userId)
      params = params.set("userId", filters.userId.toString());
    if (filters.projectId)
      params = params.set("projectId", filters.projectId.toString());
    if (filters.startDate)
      params = params.set("startDate", filters.startDate.toISOString());
    if (filters.endDate)
      params = params.set("endDate", filters.endDate.toISOString());

    return this.http.get<TimeEntry[]>(`${this.urlApi}/time`, { params });
  }

  /**
   * Actualiza registro de tiempo
   */
  updateTimeEntry(
    id: number,
    request: UpdateTimeEntryRequest
  ): Observable<TimeEntry> {
    return this.http.put<TimeEntry>(`${this.urlApi}/time/${id}`, request);
  }

  /**
   * Elimina registro de tiempo
   */
  deleteTimeEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlApi}/time/${id}`);
  }

  /**
   * Obtiene cronómetro en ejecución
   */
  getRunningTimer(): Observable<TimeEntry | null> {
    return this.currentTimeEntry$;
  }

  /**
   * Verifica si cronómetro está en ejecución
   */
  isTimerRunning(): boolean {
    return this.timerRunningSubject.value;
  }
}
```

#### TimeTrackerComponent

Componente principal del cronómetro:

```typescript
@Component({
  selector: "app-time-tracker",
  templateUrl: "./time-tracker.component.html",
  styleUrls: ["./time-tracker.component.css"],
})
export class TimeTrackerComponent implements OnInit, OnDestroy {
  isTimerRunning = false;
  elapsedTime = 0;
  displayTime = "00:00:00";

  private timerInterval: any;
  private destroy$ = new Subject<void>();

  constructor(
    private timeEntryService: TimeEntryService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Verifica si hay cronómetro en ejecución
    this.timeEntryService.timerRunning$
      .pipe(takeUntil(this.destroy$))
      .subscribe((running) => {
        this.isTimerRunning = running;
        if (running) {
          this.startTimer();
        } else {
          this.stopTimer();
        }
      });
  }

  /**
   * Inicia el cronómetro
   */
  startTimer(): void {
    this.elapsedTime = 0;
    this.timerInterval = setInterval(() => {
      this.elapsedTime++;
      this.updateDisplay();
    }, 1000);
  }

  /**
   * Detiene el cronómetro
   */
  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  /**
   * Actualiza la visualización del tiempo
   */
  private updateDisplay(): void {
    const hours = Math.floor(this.elapsedTime / 3600);
    const minutes = Math.floor((this.elapsedTime % 3600) / 60);
    const seconds = this.elapsedTime % 60;

    this.displayTime = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(
      seconds
    )}`;
  }

  /**
   * Rellena con ceros
   */
  private pad(num: number): string {
    return num.toString().padStart(2, "0");
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
```

---

### 4. Módulo de Reportes (reports/)

#### ReportsService

```typescript
@Injectable({ providedIn: "root" })
export class ReportsService {
  private http = inject(HttpClient);
  private urlApi = environment.baseUrl;

  /**
   * Obtiene reporte por usuario
   */
  getUserReport(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Observable<UserReport> {
    const params = new HttpParams()
      .set("userId", userId.toString())
      .set("startDate", startDate.toISOString())
      .set("endDate", endDate.toISOString());

    return this.http.get<UserReport>(`${this.urlApi}/reports/user/${userId}`, {
      params,
    });
  }

  /**
   * Obtiene reporte por proyecto
   */
  getProjectReport(
    projectId: number,
    startDate: Date,
    endDate: Date
  ): Observable<ProjectReport> {
    const params = new HttpParams()
      .set("startDate", startDate.toISOString())
      .set("endDate", endDate.toISOString());

    return this.http.get<ProjectReport>(
      `${this.urlApi}/reports/project/${projectId}`,
      { params }
    );
  }

  /**
   * Obtiene reporte de la empresa
   */
  getCompanyReport(startDate: Date, endDate: Date): Observable<CompanyReport> {
    const params = new HttpParams()
      .set("startDate", startDate.toISOString())
      .set("endDate", endDate.toISOString());

    return this.http.get<CompanyReport>(`${this.urlApi}/reports/company`, {
      params,
    });
  }
}
```

#### Componentes de Gráficos

**LineChartComponent** - Gráfico de líneas (Trend):

```typescript
@Component({
  selector: "app-line-chart",
  templateUrl: "./line-chart.component.html",
})
export class LineChartComponent implements OnInit {
  @Input() chartData: DailyBreakdown[];

  chartOptions: ChartConfiguration["options"];
  chartDataConfig: ChartConfiguration["data"];

  ngOnInit(): void {
    this.updateChart();
  }

  private updateChart(): void {
    this.chartDataConfig = {
      labels: this.chartData.map((d) => d.date.toLocaleDateString()),
      datasets: [
        {
          label: "Horas por día",
          data: this.chartData.map((d) => d.hours),
          borderColor: "#3f51b5",
          backgroundColor: "rgba(63, 81, 181, 0.1)",
          tension: 0.1,
        },
      ],
    };
  }
}
```

**BarChartComponent** - Gráfico de barras:

```typescript
@Component({
  selector: "app-bar-chart",
  templateUrl: "./bar-chart.component.html",
})
export class BarChartComponent implements OnInit {
  @Input() chartData: ProjectBreakdown[];

  chartDataConfig: ChartConfiguration["data"];

  ngOnInit(): void {
    this.updateChart();
  }

  private updateChart(): void {
    this.chartDataConfig = {
      labels: this.chartData.map((d) => d.projectName),
      datasets: [
        {
          label: "Horas por proyecto",
          data: this.chartData.map((d) => d.hours),
          backgroundColor: [
            "#3f51b5",
            "#e91e63",
            "#2196f3",
            "#4caf50",
            "#ff9800",
            "#f44336",
          ],
        },
      ],
    };
  }
}
```

**DoughnutChartComponent** - Gráfico de dona:

```typescript
@Component({
  selector: "app-doughnut-chart",
  templateUrl: "./doughnut-chart.component.html",
})
export class DoughnutChartComponent implements OnInit {
  @Input() chartData: ProjectBreakdown[];

  chartDataConfig: ChartConfiguration["data"];

  ngOnInit(): void {
    this.updateChart();
  }

  private updateChart(): void {
    this.chartDataConfig = {
      labels: this.chartData.map((d) => d.projectName),
      datasets: [
        {
          data: this.chartData.map((d) => d.hours),
          backgroundColor: [
            "#3f51b5",
            "#e91e63",
            "#2196f3",
            "#4caf50",
            "#ff9800",
            "#f44336",
          ],
        },
      ],
    };
  }
}
```

---

## 🛡️ Guardias de Rutas

### AuthGuard

Protege rutas que requieren autenticación:

```typescript
@Injectable({ providedIn: "root" })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Redirige a login si no está autenticado
    this.router.navigate(["/auth/login"]);
    return false;
  }
}
```

### IsAuthenticatedGuard

Redirige usuarios autenticados fuera de /auth:

```typescript
@Injectable({ providedIn: "root" })
export class IsAuthenticatedGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      // Redirige al dashboard si ya está logueado
      this.router.navigate(["/dashboard"]);
      return false;
    }

    return true;
  }
}
```

---

## 🔌 Interceptores

### LoginInterceptor

Intercepta todas las solicitudes HTTP:

```typescript
export function LoginInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const token: string = localStorage.getItem("token") ?? "";
  const authService = inject(AuthService);

  // ===== RUTAS PÚBLICAS (Sin token) =====
  if (
    req.url.includes("/login") ||
    req.url.includes("/register") ||
    req.url.includes("/refresh")
  ) {
    return next(req);
  }

  // ===== OBTENER INFORMACIÓN DE CONTEXTO =====

  // Obtiene la empresa seleccionada
  const selectedCompanyStr = localStorage.getItem("selectedCompany");
  let companyId: number | null = null;

  if (selectedCompanyStr) {
    try {
      const selectedCompany = JSON.parse(selectedCompanyStr);
      companyId = selectedCompany.id;
    } catch (e) {
      console.error("Error parsing selectedCompany:", e);
    }
  }

  // ===== AGREGA HEADERS =====

  let headers = req.headers.set("Authorization", `Bearer ${token}`);

  // Agrega header de empresa si está seleccionada
  if (companyId !== null) {
    headers = headers.set("X-Company-Id", companyId.toString());
  }

  const reqWithHeader = req.clone({ headers });

  // ===== MANEJO DE ERRORES =====

  return next(reqWithHeader).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si token expiró (401)
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap((newToken) => {
            // Crea nuevo header con token refrescado
            let newHeaders = req.headers.set(
              "Authorization",
              `Bearer ${newToken.token}`
            );

            // Agrega X-Company-Id nuevamente
            if (companyId !== null) {
              newHeaders = newHeaders.set("X-Company-Id", companyId.toString());
            }

            const reqWithNewToken = req.clone({ headers: newHeaders });

            // Reintenta solicitud original
            return next(reqWithNewToken);
          }),
          catchError((err) => {
            console.error("Error refreshing token:", err);
            return throwError(() => err);
          })
        );
      }

      return throwError(() => error);
    })
  );
}
```

**Características:**

- ✅ Agrega token automáticamente a solicitudes
- ✅ Agrega header de empresa (multi-tenant)
- ✅ Maneja tokens expirados (401)
- ✅ Refresca token automáticamente
- ✅ Reintenta solicitud original
- ✅ Salta interception para rutas públicas

---

## 📦 Interfaces de Datos

### Autenticación

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  companies: UserCompanyInfo[];
  selectedCompanyId: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  companyName: string;
  companyCode: string;
  hourlyRate?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserCompanyInfo {
  companyId: number;
  companyName: string;
  companyCode: string;
  role: string; // "Admin", "Manager", "User"
  hourlyRate?: number;
}

export interface RefreshTokenResponse {
  token: string;
}
```

### Empresa

```typescript
export interface Company {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateCompanyRequest {
  name: string;
  code: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface CompanyUser {
  userId: number;
  userName: string;
  email: string;
  role: UserRole;
  hourlyRate?: number;
}

export interface AddUserToCompanyRequest {
  userId: number;
  role: UserRole;
  hourlyRate?: number;
}
```

### Proyecto

```typescript
export interface Project {
  id: number;
  name: string;
  startDate?: Date;
  endDate?: Date;
  status: ProjectStatus;
  companyId: number;
  issueCount?: number;
}

export interface CreateProjectRequest {
  name: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateProjectRequest {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ProjectStatus;
}

export enum ProjectStatus {
  Active = "Active",
  Paused = "Paused",
  Completed = "Completed",
}
```

### Issue

```typescript
export interface Issue {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  estimatedHours?: number;
  assignedUserId?: number;
  assignedUserName?: string;
  actualHours?: number;
}

export interface CreateIssueRequest {
  projectId: number;
  title: string;
  description?: string;
  type: IssueType;
  priority: IssuePriority;
  estimatedHours?: number;
  assignedUserId?: number;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  estimatedHours?: number;
  assignedUserId?: number;
}

export enum IssueType {
  Bug = "Bug",
  Feature = "Feature",
  Task = "Task",
}

export enum IssueStatus {
  ToDo = "ToDo",
  InProgress = "InProgress",
  Done = "Done",
}

export enum IssuePriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}
```

### TimeEntry

```typescript
export interface TimeEntry {
  id: number;
  issueId?: number;
  issueName?: string;
  projectId?: number;
  projectName?: string;
  userId: number;
  userName?: string;
  companyId: number;
  startTime: Date;
  endTime?: Date;
  description?: string;
  durationMinutes?: number;
}

export interface CreateTimeEntryRequest {
  issueId?: number;
  projectId?: number;
  startTime: Date;
  endTime?: Date;
  description?: string;
}

export interface StartTimerRequest {
  issueId?: number;
  projectId?: number;
  description?: string;
}

export interface UpdateTimeEntryRequest {
  startTime?: Date;
  endTime?: Date;
  description?: string;
}

export interface TimeEntryFilter {
  userId?: number;
  projectId?: number;
  startDate?: Date;
  endDate?: Date;
}
```

### Reportes

```typescript
export interface UserReport {
  userId: number;
  userName: string;
  totalHours: number;
  projectBreakdown: ProjectBreakdown[];
  dailyBreakdown: DailyBreakdown[];
  estimatedCost: number;
}

export interface ProjectReport {
  projectId: number;
  projectName: string;
  totalHours: number;
  userBreakdown: UserBreakdown[];
  issueBreakdown: IssueBreakdown[];
  budgetRemaining?: number;
}

export interface CompanyReport {
  companyId: number;
  companyName: string;
  totalHours: number;
  projectBreakdown: ProjectBreakdown[];
  userBreakdown: UserBreakdown[];
  dailyBreakdown: DailyBreakdown[];
}

export interface ProjectBreakdown {
  projectId: number;
  projectName: string;
  hours: number;
}

export interface UserBreakdown {
  userId: number;
  userName: string;
  hours: number;
  cost?: number;
}

export interface IssueBreakdown {
  issueId: number;
  issueTitle: string;
  hours: number;
  status: IssueStatus;
}

export interface DailyBreakdown {
  date: Date;
  hours: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
```

---

## 🔄 Pipes Personalizados

### EnumLabelPipe

Convierte valores enum a etiquetas legibles:

```typescript
@Pipe({
  name: "enumLabel",
  standalone: true,
})
export class EnumLabelPipe implements PipeTransform {
  transform(value: any): string {
    const labels: { [key: string]: string } = {
      // IssueType
      Bug: "Error",
      Feature: "Funcionalidad",
      Task: "Tarea",

      // IssueStatus
      ToDo: "Por Hacer",
      InProgress: "En Progreso",
      Done: "Hecho",

      // IssuePriority
      Low: "Baja",
      Medium: "Media",
      High: "Alta",

      // ProjectStatus
      Active: "Activo",
      Paused: "Pausado",
      Completed: "Completado",

      // UserRole
      Admin: "Administrador",
      Manager: "Gerente",
      User: "Usuario",
    };

    return labels[value] || value;
  }
}
```

**Uso:**

```html
<span>{{ issue.priority | enumLabel }}</span>
<!-- Output: "Alta" -->
```

---

## 🎨 Enumeraciones

```typescript
// core/enums/user-role.enum.ts
export enum UserRole {
  Admin = "Admin",
  Manager = "Manager",
  User = "User",
}

// En interfaces/
export enum ProjectStatus {
  Active = "Active",
  Paused = "Paused",
  Completed = "Completed",
}

export enum IssueType {
  Bug = "Bug",
  Feature = "Feature",
  Task = "Task",
}

export enum IssueStatus {
  ToDo = "ToDo",
  InProgress = "InProgress",
  Done = "Done",
}

export enum IssuePriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}
```

---

## 🌍 Configuración de Entorno

### environment.ts (Producción)

```typescript
export const environment = {
  production: true,
  baseUrl: "http://192.168.1.12:5083/api",
};
```

### environment.development.ts (Desarrollo)

```typescript
export const environment = {
  production: false,
  baseUrl: "http://localhost:5083/api",
};
```

**Uso en componentes:**

```typescript
import { environment } from '../../../environments/environment';

constructor(private http: HttpClient) {
  this.apiUrl = environment.baseUrl;
}
```

---

## 🎨 Temas y Estilos

### Angular Material

```typescript
// angular.json
"styles": [
  "@angular/material/prebuilt-themes/rose-red.css",
  "src/styles.css",
  "public/themes/styles.scss"
]
```

**Temas disponibles:**

- rose-red (defecto)
- indigo-pink
- purple-green
- deeppurple-amber

### ThemeService

Maneja temas claro/oscuro:

```typescript
@Injectable({ providedIn: "root" })
export class ThemeService {
  private darkThemeSubject = new BehaviorSubject<boolean>(false);
  public darkTheme$ = this.darkThemeSubject.asObservable();

  constructor(private renderer: Renderer2, private document: Document) {
    this.loadThemePreference();
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  toggleTheme(): void {
    const isDark = !this.darkThemeSubject.value;
    this.setTheme(isDark);
  }

  /**
   * Establece tema específico
   */
  setTheme(isDark: boolean): void {
    this.darkThemeSubject.next(isDark);

    if (isDark) {
      this.renderer.addClass(this.document.body, "dark-theme");
    } else {
      this.renderer.removeClass(this.document.body, "dark-theme");
    }

    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  /**
   * Carga preferencia de tema del localStorage
   */
  private loadThemePreference(): void {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    this.setTheme(isDark);
  }

  /**
   * Obtiene tema actual
   */
  isDarkTheme(): boolean {
    return this.darkThemeSubject.value;
  }
}
```

### Estilos Globales (styles.css)

```css
/* Tema claro */
:root {
  --primary-color: #3f51b5;
  --accent-color: #e91e63;
  --bg-color: #fafafa;
  --text-color: #212121;
}

/* Tema oscuro */
body.dark-theme {
  --primary-color: #7c4dff;
  --accent-color: #ff4081;
  --bg-color: #121212;
  --text-color: #ffffff;
}

/* Aplicar colores */
body {
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: "Roboto", sans-serif;
  transition: all 0.3s ease;
}
```

---

## 🔔 Servicios Compartidos

### ToastService

Notificaciones tipo snackbar:

```typescript
@Injectable({ providedIn: "root" })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Muestra mensaje de éxito
   */
  success(message: string): void {
    this.snackBar.open(message, "Cerrar", {
      duration: 3000,
      panelClass: ["success-snackbar"],
    });
  }

  /**
   * Muestra mensaje de error
   */
  error(message: string): void {
    this.snackBar.open(message, "Cerrar", {
      duration: 5000,
      panelClass: ["error-snackbar"],
    });
  }

  /**
   * Muestra mensaje de información
   */
  info(message: string): void {
    this.snackBar.open(message, "Cerrar", {
      duration: 3000,
      panelClass: ["info-snackbar"],
    });
  }
}
```

### AudioService

Efectos de sonido:

```typescript
@Injectable({ providedIn: "root" })
export class AudioService {
  /**
   * Reproduce sonido de notificación
   */
  playNotificationSound(): void {
    const audio = new Audio("assets/sounds/notification.mp3");
    audio.play();
  }

  /**
   * Reproduce sonido de éxito
   */
  playSuccessSound(): void {
    const audio = new Audio("assets/sounds/success.mp3");
    audio.play();
  }

  /**
   * Reproduce sonido de error
   */
  playErrorSound(): void {
    const audio = new Audio("assets/sounds/error.mp3");
    audio.play();
  }
}
```

### KeyboardShortcutService

Atajos de teclado personalizados:

```typescript
export interface ShortcutAction {
  keys: string[]; // ej: ['ctrl', 's']
  action: () => void;
  description: string;
}

@Injectable({ providedIn: "root" })
export class KeyboardShortcutService implements OnDestroy {
  private shortcuts: ShortcutAction[] = [];
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeDefaultShortcuts();
  }

  /**
   * Registra atajo de teclado
   */
  registerShortcut(shortcut: ShortcutAction): void {
    this.shortcuts.push(shortcut);
  }

  /**
   * Inicializa atajos por defecto
   */
  private initializeDefaultShortcuts(): void {
    // Ctrl+N: Nuevo proyecto
    this.registerShortcut({
      keys: ["ctrl", "n"],
      action: () => console.log("Nuevo proyecto"),
      description: "Crear nuevo proyecto",
    });

    // Ctrl+T: Iniciar timer
    this.registerShortcut({
      keys: ["ctrl", "t"],
      action: () => console.log("Iniciar timer"),
      description: "Iniciar seguimiento de tiempo",
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## 📊 Componentes Principales

### LayoutComponent

Estructura principal de la aplicación:

```typescript
@Component({
  selector: "app-layout",
  templateUrl: "./layout.component.html",
  styleUrls: ["./layout.component.css"],
})
export class LayoutComponent {
  companies$ = this.companyService.companies$;
  selectedCompany$ = this.companyService.selectedCompany$;
  isTimerRunning$ = this.timeEntryService.timerRunning$;

  constructor(
    private companyService: CompanyService,
    private timeEntryService: TimeEntryService,
    private authService: AuthService
  ) {
    this.loadCompanies();
  }

  private loadCompanies(): void {
    this.companyService.getCompanies().subscribe();
  }

  selectCompany(company: Company): void {
    this.companyService.setSelectedCompany(company);
  }

  logout(): void {
    this.authService.logout();
  }
}
```

**Estructura HTML:**

```html
<div class="main-layout">
  <!-- Sidebar Izquierdo (Navegación) -->
  <app-left-side-bar></app-left-side-bar>

  <!-- Contenido Principal -->
  <main class="content">
    <router-outlet></router-outlet>
  </main>

  <!-- Sidebar Derecho (Configuración) -->
  <app-right-side-bar></app-right-side-bar>

  <!-- Botón Flotante (Timer) -->
  <app-floating-timer-button></app-floating-timer-button>
</div>
```

### LeftSideBarComponent

Navegación de la aplicación:

```typescript
@Component({
  selector: "app-left-side-bar",
  templateUrl: "./left-side-bar.component.html",
  styleUrls: ["./left-side-bar.component.css"],
})
export class LeftSideBarComponent implements OnInit {
  menuItems: Menu[] = [];
  selectedCompany$ = this.companyService.selectedCompany$;

  constructor(private companyService: CompanyService, private router: Router) {}

  ngOnInit(): void {
    this.menuItems = [
      { label: "Dashboard", icon: "dashboard", route: "/dashboard" },
      { label: "Empresa", icon: "business", route: "/company" },
      { label: "Proyectos", icon: "folder", route: "/project" },
      { label: "Issues", icon: "assignment", route: "/issue" },
      { label: "Tiempo", icon: "schedule", route: "/time-entry" },
      { label: "Reportes", icon: "bar_chart", route: "/reports" },
    ];
  }

  navigate(item: Menu): void {
    this.router.navigate([item.route]);
  }
}
```

---

## 🚀 Scripts de Compilación

### package.json

```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  }
}
```

**Comandos útiles:**

```bash
# Desarrollo
npm start
# http://localhost:4200

# Build producción
npm run build
# Output: dist/test-app/

# Build optimizado
npm run build -- --configuration production --optimization=true

# Tests
npm test

# Linting
ng lint
```

---

## 📝 Resumen

**Frontend TimeTracker** implementa:

✅ **Arquitectura modular** con lazy-loading  
✅ **Estado reactivo** con RxJS y BehaviorSubject  
✅ **Seguridad** con JWT y guardias de rutas  
✅ **Multi-tenant** con selección de empresa  
✅ **Material Design** con tema claro/oscuro  
✅ **Reportes avanzados** con múltiples gráficos  
✅ **Cronómetro en vivo** con sincronización  
✅ **Interceptores** para automatizar autenticación  
✅ **Validación de formularios** en tiempo real  
✅ **Accesibilidad** con aria labels

**Stack Tecnológico:**

- Angular 19 (Standalone Components)
- Angular Material 19
- RxJS 7.8
- Chart.js 4.4.7
- Moment.js 2.30.1
- TypeScript 5.5

---

_Documentación generada: 11 de diciembre de 2025_

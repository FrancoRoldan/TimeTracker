import { Injectable, inject } from '@angular/core';
import { TelemetryService } from '../../shared/services/telemetry.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyUser,
  AddUserToCompanyRequest,
  AddUserToCompanyResponse,
  UpdateUserInCompanyRequest
} from '../interfaces';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);
  private telemetry = inject(TelemetryService);
  private authService = inject(AuthService);
  private urlApi = environment.baseUrl;

  // State management
  private companiesSubject = new BehaviorSubject<Company[]>([]);
  public companies$ = this.companiesSubject.asObservable();

  private selectedCompanySubject = new BehaviorSubject<Company | null>(null);
  public selectedCompany$ = this.selectedCompanySubject.asObservable();

  constructor() {
    // Load selected company from localStorage on init
    const storedCompany = localStorage.getItem('selectedCompany');
    if (storedCompany) {
      this.selectedCompanySubject.next(JSON.parse(storedCompany));
    }
  }

  /**
   * Get all companies for the authenticated user
   */
  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.urlApi}/company`)
      .pipe(
        tap(companies => this.companiesSubject.next(companies))
      );
  }

  /**
   * Get a specific company by ID
   */
  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.urlApi}/company/${id}`);
  }

  /**
   * Create a new company
   */
  createCompany(data: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(`${this.urlApi}/company`, data)
      .pipe(
        tap(newCompany => {
          this.telemetry.trackEvent('company_created');
          // Add to companies list
          const currentCompanies = this.companiesSubject.value;
          this.companiesSubject.next([...currentCompanies, newCompany]);
        })
      );
  }

  /**
   * Get all users in a company
   */
  getCompanyUsers(companyId: number): Observable<CompanyUser[]> {
    return this.http.get<CompanyUser[]>(`${this.urlApi}/company/${companyId}/users`);
  }

  /**
   * Get users that are NOT in a specific company (available to add)
   */
  getAvailableUsers(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlApi}/company/${companyId}/users/available`);
  }

  /**
   * Add a user to a company (Admin only)
   */
  addUserToCompany(data: AddUserToCompanyRequest): Observable<AddUserToCompanyResponse> {
    return this.http.post<AddUserToCompanyResponse>(
      `${this.urlApi}/company/${data.companyId}/users`,
      data
    );
  }

  /**
   * Create a new user and add them to a company (Admin only)
   */
  createAndAddUserToCompany(companyId: number, data: { name: string; email: string; password: string; role: number; hourlyRate?: number }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.urlApi}/company/${companyId}/users/create`,
      data
    );
  }

  /**
   * Select a company as the current active company
   * This updates the user's role context
   */
  selectCompany(company: Company): void {
    // Cambiar de empresa reencuadra todo lo que el usuario ve después: es una de
    // las migas de pan más útiles para entender un error de multi-tenancy (§23).
    this.telemetry.trackEvent('company_switched', { companyId: String(company.id) });
    this.selectedCompanySubject.next(company);
    localStorage.setItem('selectedCompany', JSON.stringify(company));

    const currentUser = this.authService.user;

    if (!currentUser) {
      console.error('Cannot select company: No current user');
      return;
    }

    if (!currentUser.id) {
      console.error('Cannot select company: User has no id. User object:', currentUser);
      return;
    }

    this.getCompanyUsers(company.id).subscribe({
      next: (users) => {
        const userInCompany = users.find(u => u.userId === currentUser.id);
        if (userInCompany) {
          this.authService.setUserRoleInCompany(company.id, userInCompany.role);
        } else {
          console.warn('Current user is not a member of this company');
        }
      },
      error: (error) => {
        console.error('Error loading company users:', error);
      }
    });
  }

  /**
   * Get the currently selected company
   */
  getSelectedCompany(): Company | null {
    return this.selectedCompanySubject.value;
  }

  /**
   * Clear selected company
   */
  clearSelectedCompany(): void {
    this.selectedCompanySubject.next(null);
    localStorage.removeItem('selectedCompany');
  }

  /**
   * Refresh companies list
   */
  refreshCompanies(): void {
    this.getCompanies().subscribe();
  }

  /**
   * Update a company (Admin only)
   */
  updateCompany(id: number, data: UpdateCompanyRequest): Observable<Company> {
    return this.http.put<Company>(`${this.urlApi}/company/${id}`, data)
      .pipe(
        tap(updatedCompany => {
          // Update in companies list
          const currentCompanies = this.companiesSubject.value;
          const index = currentCompanies.findIndex(c => c.id === id);
          if (index !== -1) {
            currentCompanies[index] = updatedCompany;
            this.companiesSubject.next([...currentCompanies]);
          }

          // Update selected company if it's the one being updated
          const selectedCompany = this.selectedCompanySubject.value;
          if (selectedCompany && selectedCompany.id === id) {
            this.selectedCompanySubject.next(updatedCompany);
            localStorage.setItem('selectedCompany', JSON.stringify(updatedCompany));
          }
        })
      );
  }

  /**
   * Delete a company (Admin only)
   */
  deleteCompany(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.urlApi}/company/${id}`)
      .pipe(
        tap(() => {
          // Remove from companies list
          const currentCompanies = this.companiesSubject.value;
          this.companiesSubject.next(currentCompanies.filter(c => c.id !== id));

          // Clear selected company if it's the one being deleted
          const selectedCompany = this.selectedCompanySubject.value;
          if (selectedCompany && selectedCompany.id === id) {
            this.clearSelectedCompany();
          }
        })
      );
  }

  /**
   * Update a user's role and hourly rate in a company (Admin only)
   */
  updateUserInCompany(companyId: number, userId: number, data: UpdateUserInCompanyRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.urlApi}/company/${companyId}/users/${userId}`,
      data
    );
  }

  /**
   * Remove a user from a company (Admin only)
   */
  removeUserFromCompany(companyId: number, userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.urlApi}/company/${companyId}/users/${userId}`
    );
  }
}

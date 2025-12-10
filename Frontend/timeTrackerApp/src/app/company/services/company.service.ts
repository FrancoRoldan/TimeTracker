import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Company,
  CreateCompanyRequest,
  CompanyUser,
  AddUserToCompanyRequest,
  AddUserToCompanyResponse
} from '../interfaces';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);
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
   * Add a user to a company (Admin only)
   */
  addUserToCompany(data: AddUserToCompanyRequest): Observable<AddUserToCompanyResponse> {
    return this.http.post<AddUserToCompanyResponse>(
      `${this.urlApi}/company/${data.companyId}/users`,
      data
    );
  }

  /**
   * Select a company as the current active company
   * This updates the user's role context
   */
  selectCompany(company: Company): void {
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
}

import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginResponse } from '../interfaces/login-response.interface';
import { LoginRequest } from '../interfaces/login-request.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { RefreshTokenResponse } from '../interfaces/refresh-token-response.interface';
import { RegisterRequest } from '../interfaces/register-request.interface';
import { User } from '../interfaces/user.interface';
import { UserRole } from '../../core/enums';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private urlApi: string = environment.baseUrl;

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  public get user(): User | null {
    return this.userSubject.value;
  }

  constructor() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser));
    }
  }

  saveTokenLocalStorage(token: string): void {
    localStorage.setItem("token", token);
  }

  getTokenLocalStorage(): string | null {
    return localStorage.getItem("token");
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.urlApi}/auth/login`, req)
      .pipe(
        tap(res => {
          this.saveTokenLocalStorage(res.token);
          this.userSubject.next(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        })
      );
  }

  register(req: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.urlApi}/auth/register`, req)
      .pipe(
        tap(res => {
          this.saveTokenLocalStorage(res.token);
          this.userSubject.next(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        })
      );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const headers = { authorization: `Bearer ${this.getTokenLocalStorage() ?? ""}` };
    return this.http.post<RefreshTokenResponse>(`${this.urlApi}/auth/refresh`, null, { headers })
      .pipe(
        tap(newToken => this.saveTokenLocalStorage(newToken.token))
      );
  }

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCompany");
    this.userSubject.next(null);
    this.router.navigate(["auth"]);
  }

  isAuthenticated(): boolean {
    return !!this.getTokenLocalStorage();
  }

  // Multi-tenant role management
  setUserRoleInCompany(companyId: number, role: UserRole): void {
    const user = this.userSubject.value;
    if (user) {
      user.currentCompanyId = companyId;
      user.currentRole = role;
      this.userSubject.next(user);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUserRole(): UserRole | undefined {
    return this.userSubject.value?.currentRole;
  }

  hasRole(roles: UserRole[]): boolean {
    const currentRole = this.getUserRole();
    return currentRole !== undefined && roles.includes(currentRole);
  }
}

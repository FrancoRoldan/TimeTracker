import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../interfaces';
import { CompanyModalComponent } from '../company-modal/company-modal.component';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../core/enums';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Companies</h1>
        <button mat-raised-button color="primary" (click)="openCreateModal()">
          <mat-icon>add</mat-icon>
          Create Company
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (companies().length === 0) {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">business</mat-icon>
          <h2>No companies yet</h2>
          <p>Create your first company to get started</p>
          <button mat-raised-button color="primary" (click)="openCreateModal()">
            <mat-icon>add</mat-icon>
            Create Company
          </button>
        </div>
      } @else {
        <div class="companies-grid">
          @for (company of companies(); track company.id) {
            <mat-card class="company-card">
              <mat-card-header>
                <mat-icon mat-card-avatar color="primary">business</mat-icon>
                <mat-card-title>{{ company.name }}</mat-card-title>
                <mat-card-subtitle>Code: {{ company.code }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="company-info">
                  <div class="info-row">
                    <mat-icon class="info-icon">event</mat-icon>
                    <span>Created: {{ formatDate(company.createdAt) }}</span>
                  </div>
                  <div class="info-row">
                    <mat-icon class="info-icon" [style.color]="company.isActive ? '#4caf50' : '#757575'">
                      {{ company.isActive ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                    <span>{{ company.isActive ? 'Active' : 'Inactive' }}</span>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary" (click)="selectCompany(company)">
                  <mat-icon>check</mat-icon>
                  Select
                </button>
                <button mat-button (click)="viewUsers(company)">
                  <mat-icon>group</mat-icon>
                  Users
                </button>
                @if (canManageCompany()) {
                  <button mat-button (click)="openEditModal(company)">
                    <mat-icon>edit</mat-icon>
                    Edit
                  </button>
                  <button mat-button color="warn" (click)="deleteCompany(company)">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .no-data {
      text-align: center;
      padding: 60px 40px;
      background-color: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      border-radius: 8px;
      margin: 20px 0;
    }

    .no-data h2 {
      margin: 16px 0 8px 0;
      font-size: 24px;
      font-weight: 500;
    }

    .no-data p {
      margin: 0 0 24px 0;
      font-size: 16px;
      opacity: 0.8;
    }

    .companies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .company-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .company-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .company-card mat-card-header {
      margin-bottom: 16px;
    }

    .company-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .info-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .companies-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CompanyListComponent implements OnInit {
  private companyService = inject(CompanyService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  public companies = signal<Company[]>([]);
  public isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoading.set(true);
    this.companyService.getCompanies().subscribe({
      next: (companies) => {
        console.log('Companies loaded in component:', companies);
        this.companies.set(companies);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.isLoading.set(false);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load companies. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(CompanyModalComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCompanies();
      }
    });
  }

  selectCompany(company: Company): void {
    this.companyService.selectCompany(company);
    Swal.fire({
      title: 'Success!',
      text: `${company.name} selected as active company`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  viewUsers(company: Company): void {
    this.router.navigate(['/companies', company.id, 'users']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openEditModal(company: Company): void {
    const dialogRef = this.dialog.open(CompanyModalComponent, {
      width: '500px',
      data: company
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCompanies();
      }
    });
  }

  deleteCompany(company: Company): void {
    Swal.fire({
      title: 'Delete Company?',
      text: `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.companyService.deleteCompany(company.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Deleted!',
              text: `Company "${company.name}" has been deleted.`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCompanies();
          },
          error: (error) => {
            console.error('Error deleting company:', error);

            let errorMessage = 'Failed to delete company. Please try again.';
            if (error.error?.error) {
              errorMessage = error.error.error;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            }

            Swal.fire({
              title: 'Error!',
              text: errorMessage,
              icon: 'error',
              confirmButtonText: 'Ok'
            });
          }
        });
      }
    });
  }

  canManageCompany(): boolean {
    const currentRole = this.authService.getUserRole();
    // Compare both string and enum value for compatibility
    return currentRole === UserRole.Admin || currentRole === 'Admin' as any;
  }
}

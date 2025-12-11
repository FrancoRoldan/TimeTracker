import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CompanyService } from '../../services/company.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CompanyUser, Company } from '../../interfaces';
import { UserRole } from '../../../core/enums';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { EditUserInCompanyModalComponent } from '../edit-user-modal/edit-user-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatMenuModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ company()?.name }} - Users</h1>
            <p class="subtitle">Manage company members and their roles</p>
          </div>
        </div>

        @if (canAddUsers()) {
          <button mat-raised-button color="primary" (click)="openAddUserModal()">
            <mat-icon>person_add</mat-icon>
            Add User
          </button>
        }
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (users().length === 0) {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">group</mat-icon>
          <h2>No users yet</h2>
          <p>Add users to this company to get started</p>
          @if (canAddUsers()) {
            <button mat-raised-button color="primary" (click)="openAddUserModal()">
              <mat-icon>person_add</mat-icon>
              Add User
            </button>
          }
        </div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="users()" class="users-table">
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-info">
                  <mat-icon class="user-icon">person</mat-icon>
                  <div>
                    <div class="user-name">{{ user.userName }}</div>
                    <div class="user-email">{{ user.userEmail }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Role Column -->
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [style.background-color]="getRoleColor(user.role)">
                  {{ getRoleLabel(user.role) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Hourly Rate Column -->
            <ng-container matColumnDef="hourlyRate">
              <th mat-header-cell *matHeaderCellDef>Hourly Rate</th>
              <td mat-cell *matCellDef="let user">
                {{ user.hourlyRate ? '$' + user.hourlyRate : 'Not set' }}
              </td>
            </ng-container>

            <!-- Joined At Column -->
            <ng-container matColumnDef="joinedAt">
              <th mat-header-cell *matHeaderCellDef>Joined</th>
              <td mat-cell *matCellDef="let user">
                {{ formatDate(user.joinedAt) }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let user">
                @if (canManageUsers()) {
                  <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="openEditUserModal(user)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="removeUser(user)" style="color: #f44336;">
                      <mat-icon>delete</mat-icon>
                      <span>Remove</span>
                    </button>
                  </mat-menu>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card>
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
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .subtitle {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
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

    .users-table {
      width: 100%;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-icon {
      color: var(--mat-sys-primary);
    }

    .user-name {
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .user-email {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    mat-chip {
      color: white;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-left {
        width: 100%;
      }

      .users-table {
        font-size: 14px;
      }
    }
  `]
})
export class CompanyUsersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  public users = signal<CompanyUser[]>([]);
  public company = signal<Company | null>(null);
  public isLoading = signal<boolean>(false);

  public displayedColumns: string[] = ['name', 'role', 'hourlyRate', 'joinedAt', 'actions'];

  private companyId: number = 0;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    console.log('Route param id:', idParam);

    if (!idParam) {
      console.error('No company ID in route parameters');
      Swal.fire({
        title: 'Error!',
        text: 'Invalid company ID',
        icon: 'error',
        confirmButtonText: 'Ok'
      }).then(() => {
        this.router.navigate(['/companies']);
      });
      return;
    }

    this.companyId = Number(idParam);
    console.log('Parsed company ID:', this.companyId);

    if (isNaN(this.companyId) || this.companyId <= 0) {
      console.error('Invalid company ID:', this.companyId);
      Swal.fire({
        title: 'Error!',
        text: 'Invalid company ID',
        icon: 'error',
        confirmButtonText: 'Ok'
      }).then(() => {
        this.router.navigate(['/companies']);
      });
      return;
    }

    this.loadCompany();
    this.loadUsers();
  }

  loadCompany(): void {
    this.companyService.getCompanyById(this.companyId).subscribe({
      next: (company) => {
        this.company.set(company);
      },
      error: (error) => {
        console.error('Error loading company:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load company details',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.companyService.getCompanyUsers(this.companyId).subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading.set(false);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load company users',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  openAddUserModal(): void {
    const dialogRef = this.dialog.open(AddUserModalComponent, {
      width: '600px',
      data: { companyId: this.companyId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openEditUserModal(user: CompanyUser): void {
    const dialogRef = this.dialog.open(EditUserInCompanyModalComponent, {
      width: '600px',
      data: {
        companyId: this.companyId,
        userId: user.userId,
        userName: user.userName,
        currentRole: user.role,
        currentHourlyRate: user.hourlyRate
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  removeUser(user: CompanyUser): void {
    Swal.fire({
      title: 'Remove User?',
      text: `Are you sure you want to remove ${user.userName} from this company?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.companyService.removeUserFromCompany(this.companyId, user.userId).subscribe({
          next: () => {
            Swal.fire({
              title: 'Removed!',
              text: 'User has been removed from the company',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error removing user:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to remove user from company',
              icon: 'error',
              confirmButtonText: 'Ok'
            });
          }
        });
      }
    });
  }

  canAddUsers(): boolean {
    const currentRole = this.authService.getUserRole();
    // Compare both string and enum value for compatibility
    return currentRole === UserRole.Admin || currentRole === 'Admin' as any;
  }

  canManageUsers(): boolean {
    const currentRole = this.authService.getUserRole();
    // Compare both string and enum value for compatibility
    return currentRole === UserRole.Admin || currentRole === 'Admin' as any;
  }

  getRoleLabel(role: UserRole): string {
    // Handle both string and enum values
    const roleStr = typeof role === 'string' ? role : UserRole[role];
    const labels: Record<string, string> = {
      'Admin': 'Admin',
      'Manager': 'Manager',
      'Developer': 'Developer',
      'Viewer': 'Viewer'
    };
    return labels[roleStr] || 'Unknown';
  }

  getRoleColor(role: UserRole): string {
    // Handle both string and enum values
    const roleStr = typeof role === 'string' ? role : UserRole[role];
    const colors: Record<string, string> = {
      'Admin': '#f44336',
      'Manager': '#ff9800',
      'Developer': '#4caf50',
      'Viewer': '#757575'
    };
    return colors[roleStr] || '#757575';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/companies']);
  }
}

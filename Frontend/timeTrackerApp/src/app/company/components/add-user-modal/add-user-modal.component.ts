import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { CompanyService } from '../../services/company.service';
import { UserRole } from '../../../core/enums';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  template: `
    <h2 mat-dialog-title>Add User to Company</h2>

    <mat-dialog-content>
      <mat-tab-group (selectedIndexChange)="selectedTab.set($event)">
        <!-- Tab 1: Create New User -->
        <mat-tab label="Create New User">
          <div class="tab-content">
            <form [formGroup]="createUserForm" class="form-content">
              <mat-form-field class="full-width" appearance="fill">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" placeholder="Enter user name" required>
                @if (createUserForm.get('name')?.hasError('required') && createUserForm.get('name')?.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field class="full-width" appearance="fill">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="Enter email address" required>
                @if (createUserForm.get('email')?.hasError('required') && createUserForm.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
                @if (createUserForm.get('email')?.hasError('email') && createUserForm.get('email')?.touched) {
                  <mat-error>Invalid email format</mat-error>
                }
              </mat-form-field>

              <mat-form-field class="full-width" appearance="fill">
                <mat-label>Hourly Rate (Optional)</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="hourlyRate"
                  placeholder="Enter hourly rate"
                  min="0"
                  step="0.01">
                <span matPrefix>$&nbsp;</span>
                @if (createUserForm.get('hourlyRate')?.hasError('min')) {
                  <mat-error>Hourly rate must be greater than 0</mat-error>
                }
              </mat-form-field>

              <div class="info-text">
                <p><strong>Default Password:</strong> Temporal01!</p>
                <p><strong>Default Role:</strong> Developer</p>
              </div>
            </form>
          </div>
        </mat-tab>

        <!-- Tab 2: Add Existing User -->
        <mat-tab label="Add Existing User">
          <div class="tab-content">
            @if (loadingUsers()) {
              <div class="loading-spinner">
                <mat-spinner [diameter]="40"></mat-spinner>
                <p>Loading available users...</p>
              </div>
            } @else if (availableUsers().length === 0) {
              <div class="no-users">
                <p>No available users to add. All users are already in this company.</p>
              </div>
            } @else {
              <form [formGroup]="addUserForm" class="form-content">
                <mat-form-field class="full-width" appearance="fill">
                  <mat-label>Select User</mat-label>
                  <mat-select formControlName="userId" required>
                    @for (user of availableUsers(); track user.id) {
                      <mat-option [value]="user.id">
                        {{ user.nombre }} ({{ user.email }})
                      </mat-option>
                    }
                  </mat-select>
                  @if (addUserForm.get('userId')?.hasError('required') && addUserForm.get('userId')?.touched) {
                    <mat-error>Please select a user</mat-error>
                  }
                </mat-form-field>

                <mat-form-field class="full-width" appearance="fill">
                  <mat-label>Role</mat-label>
                  <mat-select formControlName="role" required>
                    <mat-option [value]="UserRole.Admin">Admin</mat-option>
                    <mat-option [value]="UserRole.Manager">Manager</mat-option>
                    <mat-option [value]="UserRole.Developer">Developer</mat-option>
                    <mat-option [value]="UserRole.Viewer">Viewer</mat-option>
                  </mat-select>
                  @if (addUserForm.get('role')?.hasError('required') && addUserForm.get('role')?.touched) {
                    <mat-error>Please select a role</mat-error>
                  }
                </mat-form-field>

                <mat-form-field class="full-width" appearance="fill">
                  <mat-label>Hourly Rate (Optional)</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="hourlyRate"
                    placeholder="Enter hourly rate"
                    min="0"
                    step="0.01">
                  <span matPrefix>$&nbsp;</span>
                  @if (addUserForm.get('hourlyRate')?.hasError('min')) {
                    <mat-error>Hourly rate must be greater than 0</mat-error>
                  }
                </mat-form-field>
              </form>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isLoading()">
        Cancel
      </button>

      @if (isLoading()) {
        <mat-spinner [diameter]="30"></mat-spinner>
      } @else {
        <button
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="!isFormValid()">
          Add User
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    .tab-content {
      padding: 20px 0;
      min-height: 300px;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
    }

    .full-width {
      width: 100%;
    }

    .info-text {
      background-color: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      padding: 12px;
      border-radius: 4px;
      font-size: 14px;
    }

    .info-text p {
      margin: 4px 0;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
    }

    .no-users {
      text-align: center;
      padding: 40px;
      background-color: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      border-radius: 4px;
      font-size: 14px;
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .form-content {
        min-width: 300px;
      }
    }
  `]
})
export class AddUserModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private dialogRef = inject(MatDialogRef<AddUserModalComponent>);
  public data = inject<{ companyId: number }>(MAT_DIALOG_DATA);

  public isLoading = signal<boolean>(false);
  public loadingUsers = signal<boolean>(false);
  public availableUsers = signal<any[]>([]);
  public selectedTab = signal<number>(0);

  public UserRole = UserRole;

  // Form for creating new user
  public createUserForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    hourlyRate: [null, [Validators.min(0)]]
  });

  // Form for adding existing user
  public addUserForm: FormGroup = this.fb.group({
    userId: [null, Validators.required],
    role: [UserRole.Developer, Validators.required],
    hourlyRate: [null, [Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadAvailableUsers();
  }

  loadAvailableUsers(): void {
    this.loadingUsers.set(true);
    this.companyService.getAvailableUsers(this.data.companyId).subscribe({
      next: (users) => {
        this.availableUsers.set(users);
        this.loadingUsers.set(false);
      },
      error: (error) => {
        console.error('Error loading available users:', error);
        this.loadingUsers.set(false);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load available users',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  isFormValid(): boolean {
    // Tab 0 = Create New User, Tab 1 = Add Existing User
    if (this.selectedTab() === 0) {
      return this.createUserForm.valid;
    } else {
      return this.addUserForm.valid && this.availableUsers().length > 0;
    }
  }

  onSave(): void {
    if (this.selectedTab() === 0) {
      this.createNewUser();
    } else {
      this.addExistingUser();
    }
  }

  createNewUser(): void {
    if (!this.createUserForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const formData = {
      name: this.createUserForm.value.name,
      email: this.createUserForm.value.email,
      password: 'Temporal01!',
      role: UserRole.Developer,
      hourlyRate: this.createUserForm.value.hourlyRate || null
    };

    this.companyService.createAndAddUserToCompany(this.data.companyId, formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        Swal.fire({
          title: 'Success!',
          text: `User ${formData.name} created and added to company successfully`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.isLoading.set(false);

        let errorMessage = 'Failed to create user. Please try again.';
        if (error.error && typeof error.error === 'object' && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && typeof error.error === 'string') {
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

  addExistingUser(): void {
    if (!this.addUserForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const formData = {
      companyId: this.data.companyId,
      userId: this.addUserForm.value.userId,
      role: this.addUserForm.value.role,
      hourlyRate: this.addUserForm.value.hourlyRate || null
    };

    this.companyService.addUserToCompany(formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        const userName = this.availableUsers().find(u => u.id === formData.userId)?.nombre || 'User';
        Swal.fire({
          title: 'Success!',
          text: `${userName} added to company successfully`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error adding user to company:', error);
        this.isLoading.set(false);

        let errorMessage = 'Failed to add user to company. Please try again.';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
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

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { CompanyService } from '../../services/company.service';
import { User } from '../../../auth/interfaces/user.interface';
import { UserRole } from '../../../core/enums';
import { environment } from '../../../../environments/environment';
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
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Add User to Company</h2>

    <mat-dialog-content>
      @if (loadingUsers()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="40"></mat-spinner>
          <p>Loading users...</p>
        </div>
      } @else {
        <form [formGroup]="userForm" class="form-content">
          <mat-form-field class="full-width" appearance="fill">
            <mat-label>Select User</mat-label>
            <mat-select formControlName="UserId" required>
              @for (user of availableUsers(); track user.id) {
                <mat-option [value]="user.id">
                  {{ user.nombre }} ({{ user.email }})
                </mat-option>
              }
            </mat-select>
            @if (userForm.get('UserId')?.hasError('required') && userForm.get('UserId')?.touched) {
              <mat-error>Please select a user</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="full-width" appearance="fill">
            <mat-label>Role</mat-label>
            <mat-select formControlName="Role" required>
              <mat-option [value]="UserRole.Admin">Admin</mat-option>
              <mat-option [value]="UserRole.Manager">Manager</mat-option>
              <mat-option [value]="UserRole.Developer">Developer</mat-option>
              <mat-option [value]="UserRole.Viewer">Viewer</mat-option>
            </mat-select>
            @if (userForm.get('Role')?.hasError('required') && userForm.get('Role')?.touched) {
              <mat-error>Please select a role</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="full-width" appearance="fill">
            <mat-label>Hourly Rate (Optional)</mat-label>
            <input
              matInput
              type="number"
              formControlName="HourlyRate"
              placeholder="Enter hourly rate"
              min="0"
              step="0.01">
            <span matPrefix>$&nbsp;</span>
            @if (userForm.get('HourlyRate')?.hasError('min')) {
              <mat-error>Hourly rate must be greater than 0</mat-error>
            }
          </mat-form-field>
        </form>
      }
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
          [disabled]="!userForm.valid || loadingUsers()">
          Add User
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 20px 0;
    }

    .full-width {
      width: 100%;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
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
  private http = inject(HttpClient);
  private companyService = inject(CompanyService);
  private dialogRef = inject(MatDialogRef<AddUserModalComponent>);
  public data = inject<{ companyId: number }>(MAT_DIALOG_DATA);

  public isLoading = signal<boolean>(false);
  public loadingUsers = signal<boolean>(false);
  public availableUsers = signal<User[]>([]);

  public UserRole = UserRole;

  public userForm: FormGroup = this.fb.group({
    UserId: [null, Validators.required],
    CompanyId: [this.data.companyId],
    Role: [UserRole.Developer, Validators.required],
    HourlyRate: [null, [Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadAllUsers();
  }

  loadAllUsers(): void {
    this.loadingUsers.set(true);
    this.http.get<User[]>(`${environment.baseUrl}/auth/users`).subscribe({
      next: (users) => {
        this.availableUsers.set(users);
        this.loadingUsers.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
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

  onSave(): void {
    if (!this.userForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const formData = this.userForm.value;

    // Remove HourlyRate if it's null or empty
    if (!formData.HourlyRate) {
      delete formData.HourlyRate;
    }

    this.companyService.addUserToCompany(formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        const userName = this.availableUsers().find(u => u.id === formData.UserId)?.nombre || 'User';
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

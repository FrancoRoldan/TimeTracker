import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CompanyService } from '../../services/company.service';
import { UserRole } from '../../../core/enums';
import Swal from 'sweetalert2';

export interface EditUserDialogData {
  companyId: number;
  userId: number;
  userName: string;
  currentRole: UserRole;
  currentHourlyRate: number | null;
}

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Edit User: {{ data.userName }}</h2>

    <mat-dialog-content>
      <form [formGroup]="userForm" class="form-content">
        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role" required>
            <mat-option [value]="UserRole.Admin">Admin</mat-option>
            <mat-option [value]="UserRole.Manager">Manager</mat-option>
            <mat-option [value]="UserRole.Developer">Developer</mat-option>
            <mat-option [value]="UserRole.Viewer">Viewer</mat-option>
          </mat-select>
          @if (userForm.get('role')?.hasError('required') && userForm.get('role')?.touched) {
            <mat-error>Role is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Hourly Rate</mat-label>
          <input matInput formControlName="hourlyRate" type="number" placeholder="Enter hourly rate" min="0" step="0.01">
          @if (userForm.get('hourlyRate')?.hasError('min')) {
            <mat-error>Hourly rate must be greater than or equal to 0</mat-error>
          }
        </mat-form-field>
      </form>
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
          [disabled]="!userForm.valid">
          Update
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
export class EditUserInCompanyModalComponent {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private dialogRef = inject(MatDialogRef<EditUserInCompanyModalComponent>);
  public data = inject<EditUserDialogData>(MAT_DIALOG_DATA);

  public isLoading = signal<boolean>(false);
  public UserRole = UserRole; // Para usar en el template

  public userForm: FormGroup = this.fb.group({
    role: [this.data.currentRole, [Validators.required]],
    hourlyRate: [this.data.currentHourlyRate, [Validators.min(0)]]
  });

  onSave(): void {
    if (!this.userForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const formData = {
      role: this.userForm.value.role,
      hourlyRate: this.userForm.value.hourlyRate ? Number(this.userForm.value.hourlyRate) : null
    };

    this.companyService.updateUserInCompany(this.data.companyId, this.data.userId, formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        Swal.fire({
          title: 'Success!',
          text: `User "${this.data.userName}" updated successfully`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.isLoading.set(false);

        let errorMessage = 'Failed to update user. Please try again.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.errors && Array.isArray(error.error.errors)) {
          errorMessage = error.error.errors.join(', ');
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

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../interfaces';
import Swal from 'sweetalert2';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-company-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Company' : 'Create Company' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="companyForm" class="form-content">
        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Company Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter company name" required>
          @if (companyForm.get('name')?.hasError('required') && companyForm.get('name')?.touched) {
            <mat-error>Company name is required</mat-error>
          }
          @if (companyForm.get('name')?.hasError('maxlength')) {
            <mat-error>Company name cannot exceed 200 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Company Code</mat-label>
          <input matInput formControlName="code" placeholder="Enter company code" required>
          @if (companyForm.get('code')?.hasError('required') && companyForm.get('code')?.touched) {
            <mat-error>Company code is required</mat-error>
          }
          @if (companyForm.get('code')?.hasError('maxlength')) {
            <mat-error>Company code cannot exceed 50 characters</mat-error>
          }
        </mat-form-field>

        @if (data) {
          <div class="checkbox-field">
            <mat-checkbox formControlName="isActive">
              Active
            </mat-checkbox>
          </div>
        }
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
          [disabled]="!companyForm.valid">
          {{ data ? 'Update' : 'Create' }}
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

    .checkbox-field {
      margin: 16px 0;
    }

    @media (max-width: 768px) {
      .form-content {
        min-width: 300px;
      }
    }
  `]
})
export class CompanyModalComponent {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private dialogRef = inject(MatDialogRef<CompanyModalComponent>);
  private authService = inject(AuthService);

  public data = inject<Company | null>(MAT_DIALOG_DATA);

  public isLoading = signal<boolean>(false);

  public companyForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    isActive: [true]
  });

  constructor() {
    // If editing, populate form with company data
    if (this.data) {
      this.companyForm.patchValue({
        name: this.data.name,
        code: this.data.code,
        isActive: this.data.isActive
      });
    }
  }

  onSave(): void {
    if (!this.companyForm.valid) {
      return;
    }

    this.isLoading.set(true);
    const formData = this.companyForm.value;

    // Determine if it's create or update
    const request$ = this.data
      ? this.companyService.updateCompany(this.data.id, formData)
      : this.companyService.createCompany(formData);

    request$.subscribe({
      next: (company) => {
        this.isLoading.set(false);
        this.authService.refreshToken().subscribe(() => {});
        const action = this.data ? 'updated' : 'created';
        Swal.fire({
          title: 'Success!',
          text: `Company "${company.name}" ${action} successfully`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.dialogRef.close(company);
      },
      error: (error) => {
        console.error(`Error ${this.data ? 'updating' : 'creating'} company:`, error);
        this.isLoading.set(false);

        let errorMessage = `Failed to ${this.data ? 'update' : 'create'} company. Please try again.`;
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
    this.dialogRef.close(null);
  }
}

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
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';

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
    <h2 mat-dialog-title>Editar usuario: {{ data.userName }}</h2>

    <mat-dialog-content>
      <form [formGroup]="userForm" class="form-content">
        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role" required>
            <mat-option [value]="UserRole.Admin">Administrador</mat-option>
            <mat-option [value]="UserRole.Manager">Gerente</mat-option>
            <mat-option [value]="UserRole.Developer">Desarrollador</mat-option>
            <mat-option [value]="UserRole.Viewer">Visualizador</mat-option>
          </mat-select>
          @if (userForm.get('role')?.hasError('required') && userForm.get('role')?.touched) {
            <mat-error>El rol es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Tarifa por hora</mat-label>
          <input matInput formControlName="hourlyRate" type="number" placeholder="Introduce la tarifa por hora" min="0" step="0.01">
          @if (userForm.get('hourlyRate')?.hasError('min')) {
            <mat-error>La tarifa por hora debe ser mayor o igual a 0</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isLoading()">
        Cancelar
      </button>

      @if (isLoading()) {
        <mat-spinner [diameter]="30"></mat-spinner>
      } @else {
        <button
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="!userForm.valid">
          Actualizar
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
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public isLoading = signal<boolean>(false);
  public UserRole = UserRole; // Para usar en el template

  public userForm: FormGroup = this.fb.group({
    role: [this.normalizeRole(this.data.currentRole), [Validators.required]],
    hourlyRate: [this.data.currentHourlyRate, [Validators.min(0)]]
  });

  // Normaliza el rol para asegurarse que coincida con el enum
  private normalizeRole(role: any): UserRole {
    // Si ya es un número válido del enum, retornarlo
    if (typeof role === 'number' && role >= 1 && role <= 4) {
      return role as UserRole;
    }

    // Si es string, convertirlo al valor del enum
    if (typeof role === 'string') {
      const roleMap: Record<string, UserRole> = {
        'Admin': UserRole.Admin,
        'Manager': UserRole.Manager,
        'Developer': UserRole.Developer,
        'Viewer': UserRole.Viewer
      };
      return roleMap[role] || UserRole.Developer;
    }

    // Por defecto retornar Developer
    return UserRole.Developer;
  }

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
        this.toastService.showSuccess(`User "${this.data.userName}" updated successfully`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.isLoading.set(false);

        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to update user. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

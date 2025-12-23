import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../user/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';

export interface ResetPasswordDialogData {
  userId: number;
  userName: string;
}

@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Restablecer contraseña</h2>

    <mat-dialog-content>
      <div class="info-message">
        <mat-icon color="primary">info</mat-icon>
        <p>Vas a restablecer la contraseña de <strong>{{ data.userName }}</strong></p>
      </div>

      <form [formGroup]="passwordForm" class="form-content">
        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Nueva contraseña</mat-label>
          <input
            matInput
            formControlName="newPassword"
            [type]="hidePassword() ? 'password' : 'text'"
            placeholder="Ingresa la nueva contraseña">
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hidePassword.set(!hidePassword())"
            [attr.aria-label]="'Hide password'"
            [attr.aria-pressed]="hidePassword()">
            <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          @if (passwordForm.get('newPassword')?.hasError('required') && passwordForm.get('newPassword')?.touched) {
            <mat-error>La nueva contraseña es requerida</mat-error>
          }
          @if (passwordForm.get('newPassword')?.hasError('minlength')) {
            <mat-error>La contraseña debe tener al menos 6 caracteres</mat-error>
          }
          @if (passwordForm.get('newPassword')?.hasError('pattern')) {
            <mat-error>Debe contener al menos una mayúscula, una minúscula y un número</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="outline">
          <mat-label>Confirmar contraseña</mat-label>
          <input
            matInput
            formControlName="confirmPassword"
            [type]="hideConfirmPassword() ? 'password' : 'text'"
            placeholder="Confirma la nueva contraseña">
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hideConfirmPassword.set(!hideConfirmPassword())"
            [attr.aria-label]="'Hide password'"
            [attr.aria-pressed]="hideConfirmPassword()">
            <mat-icon>{{hideConfirmPassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          @if (passwordForm.get('confirmPassword')?.hasError('required') && passwordForm.get('confirmPassword')?.touched) {
            <mat-error>La confirmación es requerida</mat-error>
          }
          @if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched) {
            <mat-error>Las contraseñas no coinciden</mat-error>
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
          (click)="onReset()"
          [disabled]="!passwordForm.valid">
          <mat-icon>lock_reset</mat-icon>
          Restablecer
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    .info-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      margin-bottom: 16px;
      background-color: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      border-radius: 8px;
    }

    .info-message mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-message p {
      margin: 0;
      font-size: 14px;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 8px 0;
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
export class ResetPasswordModalComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<ResetPasswordModalComponent>);
  public data = inject<ResetPasswordDialogData>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public isLoading = signal<boolean>(false);
  public hidePassword = signal<boolean>(true);
  public hideConfirmPassword = signal<boolean>(true);

  public passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onReset(): void {
    if (!this.passwordForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const resetRequest = {
      userId: this.data.userId,
      newPassword: this.passwordForm.value.newPassword
    };

    this.userService.resetPassword(resetRequest).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.toastService.showSuccess(response.message || `Contraseña restablecida para ${this.data.userName}`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error resetting password:', error);
        this.isLoading.set(false);

        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'No se pudo restablecer la contraseña. Intenta de nuevo.')
          } as ErrorDialogData
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

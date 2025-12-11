import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../interfaces/login-request.interface';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  template: `
  <form [formGroup]="myForm">
            
    <h2 class="mb-4">Iniciar sesión</h2>

    <mat-form-field class="w-100 mb-2 form-field" appearance="fill">
      <mat-label>Email</mat-label>
      <input matInput formControlName="email" type="text" placeholder="Email de usuario">
      <mat-icon matSuffix>person</mat-icon>
    </mat-form-field>

    <mat-form-field class="w-100 mb-4 form-field" appearance="fill">
      <mat-label>Contraseña</mat-label>
      <input matInput formControlName="password" [type]="hide() ? 'password' : 'text'" placeholder="Contraseña">
      <mat-icon matSuffix (click)="clickEvent($event)">{{ hide() ? 'visibility_off' : 'visibility' }}</mat-icon>
    </mat-form-field>

    @if (isLoading()) {
      <div class="mat-spinner-container">
        <mat-spinner  [diameter]="50"></mat-spinner>
      </div>
      
    }
    @else {
      <button mat-button mat-flat-button color="primary" class="w-100" [disabled]="!myForm.valid" (click)="sendForm()">
        ingresar
      </button>
    }
  </form>
  `,
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private router: Router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  public isLoading = signal<boolean>(false);
  public hide = signal(true);

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
    return;
  }

  public myForm: FormGroup = this.fb.group({
    email: ["", [Validators.required,Validators.email]],
    password: ["", [Validators.required]],
  });


  sendForm() {
    if (!this.myForm.valid) { return; }

    const req: LoginRequest = this.myForm.value;

    this.isLoading.set(true);

    this.authService.login(req).subscribe(
      {
        next: () => {
          this.router.navigate([""]);
          this.isLoading.set(false);
        },
        error: (message:HttpErrorResponse) => {
          this.isLoading.set(false);
          this.dialog.open(ErrorDialogComponent, {
            data: {
              title: 'Error!',
              message: extractErrorMessage(message, 'Error de comunicación.')
            } as ErrorDialogData
          });
        }
      }
    );
  }
}

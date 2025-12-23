import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../services/user.service';
import { UserProfile, UpdateUserRequest, UpdatePasswordRequest } from '../../interfaces/user.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../auth/interfaces/user.interface';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Mi Perfil</h1>
      </div>

      @if (loading()) {
        <div class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <mat-card class="profile-card">
          <mat-card-header>
            <div mat-card-avatar class="profile-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <mat-card-title>{{ userProfile()?.nombre }}</mat-card-title>
            <mat-card-subtitle>{{ userProfile()?.email }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <mat-tab-group>
              <!-- User Information Tab -->
              <mat-tab label="Información Personal">
                <div class="tab-content">
                  @if (editMode()) {
                    <form [formGroup]="userForm" (ngSubmit)="updateUserInfo()">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Nombre</mat-label>
                        <input matInput formControlName="nombre" placeholder="Ingresa tu nombre">
                        <mat-icon matPrefix>person</mat-icon>
                        @if (userForm.get('nombre')?.hasError('required') && userForm.get('nombre')?.touched) {
                          <mat-error>El nombre es requerido</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Email</mat-label>
                        <input matInput formControlName="email" type="email" placeholder="Ingresa tu correo">
                        <mat-icon matPrefix>email</mat-icon>
                        @if (userForm.get('email')?.hasError('required') && userForm.get('email')?.touched) {
                          <mat-error>El email es requerido</mat-error>
                        }
                        @if (userForm.get('email')?.hasError('email') && userForm.get('email')?.touched) {
                          <mat-error>Ingresa un email válido</mat-error>
                        }
                      </mat-form-field>

                      <div class="form-actions">
                        <button mat-button type="button" (click)="cancelEdit()">
                          <mat-icon>cancel</mat-icon>
                          Cancelar
                        </button>
                        <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid || updatingUser()">
                          @if (updatingUser()) {
                            <mat-spinner diameter="20"></mat-spinner>
                          } @else {
                            <mat-icon>save</mat-icon>
                          }
                          Guardar Cambios
                        </button>
                      </div>
                    </form>
                  } @else {
                    <div class="info-display">
                      <div class="info-item">
                        <mat-icon class="info-icon">person</mat-icon>
                        <div class="info-content">
                          <label>Nombre:</label>
                          <span>{{ userProfile()?.nombre }}</span>
                        </div>
                      </div>

                      <div class="info-item">
                        <mat-icon class="info-icon">email</mat-icon>
                        <div class="info-content">
                          <label>Email:</label>
                          <span>{{ userProfile()?.email }}</span>
                        </div>
                      </div>

                      @if (userProfile()?.fechaCreacion) {
                        <div class="info-item">
                          <mat-icon class="info-icon">date_range</mat-icon>
                          <div class="info-content">
                            <label>Fecha de registro:</label>
                            <span>{{ userProfile()?.fechaCreacion | date:'dd/MM/yyyy' }}</span>
                          </div>
                        </div>
                      }

                      <div class="form-actions">
                        <button mat-raised-button color="primary" (click)="enableEdit()">
                          <mat-icon>edit</mat-icon>
                          Editar Información
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- Change Password Tab -->
              <mat-tab label="Cambiar Contraseña">
                <div class="tab-content">
                  <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Contraseña Actual</mat-label>
                      <input matInput formControlName="currentPassword" type="password" 
                             placeholder="Ingresa tu contraseña actual">
                      
                      @if (passwordForm.get('currentPassword')?.hasError('required') && passwordForm.get('currentPassword')?.touched) {
                        <mat-error>La contraseña actual es requerida</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nueva Contraseña</mat-label>
                      <input matInput formControlName="newPassword" type="password" 
                             placeholder="Ingresa tu nueva contraseña">
                      
                      @if (passwordForm.get('newPassword')?.hasError('required') && passwordForm.get('newPassword')?.touched) {
                        <mat-error>La nueva contraseña es requerida</mat-error>
                      }
                      @if (passwordForm.get('newPassword')?.hasError('minlength') && passwordForm.get('newPassword')?.touched) {
                        <mat-error>La contraseña debe tener al menos 6 caracteres</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Confirmar Nueva Contraseña</mat-label>
                      <input matInput formControlName="confirmPassword" type="password" 
                             placeholder="Confirma tu nueva contraseña">
                      @if (passwordForm.get('confirmPassword')?.hasError('required') && passwordForm.get('confirmPassword')?.touched) {
                        <mat-error>La confirmación de contraseña es requerida</mat-error>
                      }
                      @if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched) {
                        <mat-error>Las contraseñas no coinciden</mat-error>
                      }
                    </mat-form-field>

                    <div class="form-actions">
                      <button mat-button type="button" (click)="resetPasswordForm()">
                        <mat-icon>refresh</mat-icon>
                        Limpiar
                      </button>
                      <button mat-raised-button color="primary" type="submit" 
                              [disabled]="passwordForm.invalid || updatingPassword()">
                        @if (updatingPassword()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>security</mat-icon>
                        }
                        Cambiar Contraseña
                      </button>
                    </div>
                  </form>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styleUrl: './user-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UserInfoComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  loading = signal(true);
  editMode = signal(false);
  updatingUser = signal(false);
  updatingPassword = signal(false);
  userProfile = signal<UserProfile | null>(null);
  currentUser = signal<User | null>(null);

  userForm: FormGroup;
  passwordForm: FormGroup;

  constructor() {
    this.currentUser.set(this.authService.user);
    
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  loadUserProfile(): void {
    const userId = this.currentUser()?.id;
    if (!userId) {
      this.snackBar.open('Usuario no encontrado', 'Cerrar', { duration: 3000 });
      this.loading.set(false);
      return;
    }

    this.userService.getUserProfile(userId).subscribe({
      next: (profile) => {
        this.userProfile.set(profile);
        this.userForm.patchValue({
          nombre: profile.nombre,
          email: profile.email
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando perfil:', error);
        this.snackBar.open('Error al cargar el perfil', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  enableEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    const profile = this.userProfile();
    if (profile) {
      this.userForm.patchValue({
        nombre: profile.nombre,
        email: profile.email
      });
    }
  }

  updateUserInfo(): void {
    if (this.userForm.invalid) return;

    const profile = this.userProfile();
    const currentUser = this.currentUser();
    
    if (!profile || !currentUser) {
      this.snackBar.open('Error: Información de usuario no disponible', 'Cerrar', { duration: 3000 });
      return;
    }

    this.updatingUser.set(true);

    const updateRequest: UpdateUserRequest = {
      id: profile.id,
      nombre: this.userForm.value.nombre,
      email: this.userForm.value.email,
      usuarioActualizacion: currentUser.email || currentUser.email
    };

    this.userService.updateUser(updateRequest).subscribe({
      next: (response) => {
        this.userProfile.set(response.user);
        this.editMode.set(false);
        this.updatingUser.set(false);
        this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error actualizando usuario:', error);
        this.snackBar.open(
          error.error?.error || 'Error al actualizar la información', 
          'Cerrar', 
          { duration: 3000 }
        );
        this.updatingUser.set(false);
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    const userId = this.currentUser()?.id;
    if (!userId) {
      this.snackBar.open('Usuario no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }

    this.updatingPassword.set(true);

    const passwordRequest: UpdatePasswordRequest = {
      userId: userId,
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.userService.updatePassword(passwordRequest).subscribe({
      next: (response) => {
        this.resetPasswordForm();
        this.updatingPassword.set(false);
        this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error actualizando contraseña:', error);
        this.snackBar.open(
          error.error?.error || 'Error al cambiar la contraseña', 
          'Cerrar', 
          { duration: 3000 }
        );
        this.updatingPassword.set(false);
      }
    });
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
    this.passwordForm.markAsUntouched();
  }
}
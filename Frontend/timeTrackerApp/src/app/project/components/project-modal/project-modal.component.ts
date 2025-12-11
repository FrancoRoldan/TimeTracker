import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../interfaces';
import { ProjectStatus } from '../../../core/enums';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    EnumLabelPipe
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Editar proyecto' : 'Crear proyecto' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="projectForm" class="form-content">
        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Nombre del proyecto</mat-label>
          <input matInput formControlName="name" placeholder="Ingrese el nombre del proyecto" required>
          @if (projectForm.get('name')?.hasError('required') && projectForm.get('name')?.touched) {
            <mat-error>El nombre del proyecto es obligatorio</mat-error>
          }
          @if (projectForm.get('name')?.hasError('maxlength')) {
            <mat-error>El nombre del proyecto no puede exceder los 200 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="status" required>
            <mat-option [value]="ProjectStatus.Active">
              {{ ProjectStatus.Active | enumLabel:'ProjectStatus' }}
            </mat-option>
            <mat-option [value]="ProjectStatus.OnHold">
              {{ ProjectStatus.OnHold | enumLabel:'ProjectStatus' }}
            </mat-option>
            <mat-option [value]="ProjectStatus.Completed">
              {{ ProjectStatus.Completed | enumLabel:'ProjectStatus' }}
            </mat-option>
            <mat-option [value]="ProjectStatus.Cancelled">
              {{ ProjectStatus.Cancelled | enumLabel:'ProjectStatus' }}
            </mat-option>
          </mat-select>
          @if (projectForm.get('status')?.hasError('required') && projectForm.get('status')?.touched) {
            <mat-error>El estado es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Fecha de inicio</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate" required>
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
          @if (projectForm.get('startDate')?.hasError('required') && projectForm.get('startDate')?.touched) {
            <mat-error>La fecha de inicio es obligatoria</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Fecha de finalización (opcional)</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate">
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
          @if (projectForm.hasError('endDateBeforeStart')) {
            <mat-error>La fecha de finalización debe ser posterior a la de inicio</mat-error>
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
          [disabled]="!projectForm.valid">
          {{ isEditMode ? 'Actualizar' : 'Crear' }}
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
      min-width: 500px;
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
export class ProjectModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private dialogRef = inject(MatDialogRef<ProjectModalComponent>);
  public data = inject<{ project: Project | null; companyId: number }>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public isLoading = signal<boolean>(false);
  public isEditMode: boolean = false;
  public ProjectStatus = ProjectStatus;

  public projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    status: [ProjectStatus.Active, Validators.required],
    startDate: [null, Validators.required],
    endDate: [null],
    companyId: [this.data.companyId]
  }, {
    validators: this.endDateValidator
  });

  ngOnInit(): void {
    if (this.data.project) {
      this.isEditMode = true;
      this.projectForm.patchValue({
        name: this.data.project.name,
        status: this.data.project.status,
        startDate: new Date(this.data.project.startDate),
        endDate: this.data.project.endDate ? new Date(this.data.project.endDate) : null,
        companyId: this.data.project.companyId
      });
    }
  }

  endDateValidator(form: FormGroup) {
    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;

    if (startDate && endDate && endDate < startDate) {
      return { endDateBeforeStart: true };
    }
    return null;
  }

  onSave(): void {

    if (!this.projectForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const formData = { ...this.projectForm.value };

    // Convert dates to ISO string
    if (formData.startDate) {
      formData.startDate = new Date(formData.startDate).toISOString();
    }
    if (formData.endDate) {
      formData.endDate = new Date(formData.endDate).toISOString();
    }

    const request$ = this.isEditMode
      ? this.projectService.updateProject(this.data.project!.id, formData)
      : this.projectService.createProject(formData);

    request$.subscribe({
      next: (project) => {
        this.isLoading.set(false);
        this.toastService.showSuccess(`Project "${project.name}" ${this.isEditMode ? 'updated' : 'created'} successfully`);
        this.dialogRef.close(project);
      },
      error: (error) => {
        console.error('Error saving project:', error);
        this.isLoading.set(false);

        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, `Failed to ${this.isEditMode ? 'update' : 'create'} project. Please try again.`)
          } as ErrorDialogData
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

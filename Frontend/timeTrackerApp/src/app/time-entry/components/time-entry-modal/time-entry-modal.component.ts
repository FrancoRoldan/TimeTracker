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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimeEntryService } from '../../services/time-entry.service';
import { IssueService } from '../../../issue/services/issue.service';
import { ProjectService } from '../../../project/services/project.service';
import { TimeEntry } from '../../interfaces';
import { Issue } from '../../../issue/interfaces';
import { Project } from '../../../project/interfaces';
import { CompanyService } from '../../../company/services/company.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-time-entry-modal',
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
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Editar registro de tiempo' : 'Crear registro de tiempo' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="entryForm" class="form-content">
        <!-- Project Selection -->
        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Proyecto</mat-label>
          <mat-select formControlName="projectId" (selectionChange)="onProjectChange($event.value)" required>
            @for (project of availableProjects(); track project.id) {
              <mat-option [value]="project.id">{{ project.name }}</mat-option>
            }
          </mat-select>
          @if (entryForm.get('projectId')?.hasError('required') && entryForm.get('projectId')?.touched) {
            <mat-error>El proyecto es obligatorio</mat-error>
          }
        </mat-form-field>

        <!-- Issue Selection (Optional) -->
        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Problema (opcional)</mat-label>
          <mat-select formControlName="issueId" [disabled]="!entryForm.get('projectId')?.value">
            <mat-option [value]="null">Sin problema específico</mat-option>
            @for (issue of availableIssues(); track issue.id) {
              <mat-option [value]="issue.id">{{ issue.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Descripción</mat-label>
          <textarea
            matInput
            formControlName="description"
            placeholder="¿En qué trabajaste?"
            rows="3">
          </textarea>
          @if (entryForm.get('description')?.hasError('maxlength')) {
            <mat-error>La descripción no puede exceder 500 caracteres</mat-error>
          }
        </mat-form-field>

        <!-- Start Date and Time -->
        <div class="form-row">
          <mat-form-field appearance="fill">
            <mat-label>Fecha de inicio</mat-label>
            <input
              matInput
              [matDatepicker]="startDatePicker"
              formControlName="startDate"
              required>
            <mat-datepicker-toggle matSuffix [for]="startDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #startDatePicker></mat-datepicker>
            @if (entryForm.get('startDate')?.hasError('required') && entryForm.get('startDate')?.touched) {
              <mat-error>La fecha de inicio es obligatoria</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Hora de inicio</mat-label>
            <input
              matInput
              type="time"
              formControlName="startTime"
              required>
            @if (entryForm.get('startTime')?.hasError('required') && entryForm.get('startTime')?.touched) {
              <mat-error>La hora de inicio es obligatoria</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- End Date and Time -->
        <div class="form-row">
          <mat-form-field appearance="fill">
            <mat-label>Fecha de finalización</mat-label>
            <input
              matInput
              [matDatepicker]="endDatePicker"
              formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="endDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #endDatePicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Hora de finalización</mat-label>
            <input
              matInput
              type="time"
              formControlName="endTime">
            @if (entryForm.hasError('endBeforeStart')) {
              <mat-error>La hora de finalización debe ser posterior a la de inicio</mat-error>
            }
          </mat-form-field>
        </div>

        @if (calculatedHours() !== null) {
          <div class="calculated-hours">
            <mat-icon>schedule</mat-icon>
            <span>Duración: <strong>{{ calculatedHours() }}h</strong></span>
          </div>
        }
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
          [disabled]="!entryForm.valid">
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .calculated-hours {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      border-radius: 8px;
    }

    .calculated-hours mat-icon {
      color: var(--mat-sys-primary);
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

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TimeEntryModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private timeEntryService = inject(TimeEntryService);
  private issueService = inject(IssueService);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<TimeEntryModalComponent>);
  public data = inject<{ entry: TimeEntry | null }>(MAT_DIALOG_DATA);
  public selectedCompany = signal<any>(null);
  private toastService = inject(ToastService);
  public isLoading = signal<boolean>(false);
  public isEditMode: boolean = false;
  public availableIssues = signal<Issue[]>([]);
  public availableProjects = signal<Project[]>([]);

  public entryForm: FormGroup = this.fb.group({
    projectId: [null, Validators.required],
    issueId: [null], // Optional - can track time on project without specific issue
    description: ['', [Validators.maxLength(500)]],
    startDate: [null, Validators.required],
    startTime: ['', Validators.required],
    endDate: [null],
    endTime: ['']
  }, {
    validators: this.timeValidator.bind(this)
  });

  public calculatedHours = signal<string | null>(null);

  ngOnInit(): void {
    // Watch for changes to calculate hours
    this.entryForm.valueChanges.subscribe(() => {
      this.calculateHours();
    });

    if (this.data.entry) {
      this.isEditMode = true;
      const startDate = new Date(this.data.entry.startTime);
      const endDate = this.data.entry.endTime ? new Date(this.data.entry.endTime) : null;

      // Load projects and issues in parallel, then set form values
      const projects$ = this.projectService.getProjects();
      const issues$ = this.data.entry.projectId
        ? this.issueService.getMyIssuesByProject(this.data.entry.projectId)
        : of([]);

      forkJoin({ projects: projects$, issues: issues$ }).subscribe({
        next: ({ projects, issues }) => {
          this.availableProjects.set(projects);
          this.availableIssues.set(issues);

          // Now set form values after data is loaded
          this.entryForm.patchValue({
            projectId: this.data.entry!.projectId,
            issueId: this.data.entry!.issueId,
            description: this.data.entry!.description,
            startDate: startDate,
            startTime: this.formatTimeOnly(startDate),
            endDate: endDate,
            endTime: endDate ? this.formatTimeOnly(endDate) : ''
          });

          this.calculateHours();
        },
        error: (error) => {
          console.error('Error loading data:', error);
          // Still set time values even if projects/issues fail to load
          this.entryForm.patchValue({
            description: this.data.entry!.description,
            startDate: startDate,
            startTime: this.formatTimeOnly(startDate),
            endDate: endDate,
            endTime: endDate ? this.formatTimeOnly(endDate) : ''
          });
        }
      });
    } else {
      // Create mode: just load projects
      this.loadProjects();
    }
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.availableProjects.set(projects);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      }
    });
  }

  onProjectChange(projectId: number): void {
    // Reset issue selection when project changes
    this.entryForm.patchValue({ issueId: null });
    this.availableIssues.set([]);
    if (projectId) {
      this.loadIssuesForProject(projectId);
    }
  }

  loadIssuesForProject(projectId: number): void {
    this.issueService.getMyIssuesByProject(projectId).subscribe({
      next: (issues) => {
        this.availableIssues.set(issues);
      },
      error: (error) => {
        console.error('Error loading issues:', error);
      }
    });
  }

  timeValidator(form: FormGroup) {
    const startDate = form.get('startDate')?.value;
    const startTime = form.get('startTime')?.value;
    let endDate = form.get('endDate')?.value;
    const endTime = form.get('endTime')?.value;

    if (startDate && startTime && endTime) {
      // Si no hay fecha de fin, asumir misma fecha que inicio
      if (!endDate) {
        endDate = startDate;
      }

      const start = this.combineDateTime(startDate, startTime);
      const end = this.combineDateTime(endDate, endTime);

      if (end <= start) {
        return { endBeforeStart: true };
      }
    }
    return null;
  }

  private combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  calculateHours(): void {
    const startDate = this.entryForm.get('startDate')?.value;
    const startTime = this.entryForm.get('startTime')?.value;
    let endDate = this.entryForm.get('endDate')?.value;
    const endTime = this.entryForm.get('endTime')?.value;

    // Si hay fecha y hora de inicio, y hora de fin (pero no fecha de fin), asumir misma fecha
    if (startDate && startTime && endTime) {
      if (!endDate) {
        endDate = startDate;
      }

      const start = this.combineDateTime(startDate, startTime);
      const end = this.combineDateTime(endDate, endTime);
      const diffMs = end.getTime() - start.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      if (hours > 0) {
        this.calculatedHours.set(hours.toFixed(2));
      } else {
        this.calculatedHours.set(null);
      }
    } else {
      this.calculatedHours.set(null);
    }
  }

  formatTimeOnly(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onSave(): void {
    if (!this.entryForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const formValue = this.entryForm.getRawValue();

    // Combine date and time fields
    const formData: any = {
      projectId: formValue.projectId,
      issueId: formValue.issueId,
      description: formValue.description
    };

    // Combine start date and time
    if (formValue.startDate && formValue.startTime) {
      const startDateTime = this.combineDateTime(formValue.startDate, formValue.startTime);
      formData.startTime = startDateTime.toISOString();
    }

    // Combine end date and time (if provided)
    if (formValue.endTime) {
      // Si no hay fecha de fin, usar fecha de inicio
      const endDateToUse = formValue.endDate || formValue.startDate;
      if (endDateToUse) {
        const endDateTime = this.combineDateTime(endDateToUse, formValue.endTime);
        formData.endTime = endDateTime.toISOString();
      }
    }

    // Remove empty description
    if (!formData.description) {
      delete formData.description;
    }

    const request$ = this.isEditMode
      ? this.timeEntryService.updateTimeEntry(this.data.entry!.id, formData)
      : this.timeEntryService.createTimeEntry(formData);

    request$.subscribe({
      next: (entry) => {
        this.isLoading.set(false);
        this.toastService.showSuccess(`Time entry ${this.isEditMode ? 'updated' : 'created'} successfully`);
        this.dialogRef.close(entry);
      },
      error: (error) => {
        console.error('Error saving time entry:', error);
        this.isLoading.set(false);

        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, `Failed to ${this.isEditMode ? 'update' : 'create'} time entry. Please try again.`)
          } as ErrorDialogData
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

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
import Swal from 'sweetalert2';

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
    <h2 mat-dialog-title>{{ isEditMode ? 'Edit Time Entry' : 'Create Time Entry' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="entryForm" class="form-content">
        @if (!isEditMode) {
          <!-- Project Selection -->
          <mat-form-field class="full-width" appearance="fill">
            <mat-label>Project</mat-label>
            <mat-select formControlName="projectId" (selectionChange)="onProjectChange($event.value)" required>
              @for (project of availableProjects(); track project.id) {
                <mat-option [value]="project.id">{{ project.name }}</mat-option>
              }
            </mat-select>
            @if (entryForm.get('projectId')?.hasError('required') && entryForm.get('projectId')?.touched) {
              <mat-error>Project is required</mat-error>
            }
          </mat-form-field>

          <!-- Issue Selection (Optional) -->
          <mat-form-field class="full-width" appearance="fill">
            <mat-label>Issue (Optional)</mat-label>
            <mat-select formControlName="issueId" [disabled]="!entryForm.get('projectId')?.value">
              <mat-option [value]="null">No specific issue</mat-option>
              @for (issue of availableIssues(); track issue.id) {
                <mat-option [value]="issue.id">{{ issue.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            formControlName="description"
            placeholder="What did you work on?"
            rows="3">
          </textarea>
          @if (entryForm.get('description')?.hasError('maxlength')) {
            <mat-error>Description cannot exceed 500 characters</mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="fill">
            <mat-label>Start Date & Time</mat-label>
            <input
              matInput
              type="datetime-local"
              formControlName="startTime"
              required>
            @if (entryForm.get('startTime')?.hasError('required') && entryForm.get('startTime')?.touched) {
              <mat-error>Start time is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>End Date & Time</mat-label>
            <input
              matInput
              type="datetime-local"
              formControlName="endTime">
            @if (entryForm.hasError('endBeforeStart')) {
              <mat-error>End time must be after start time</mat-error>
            }
          </mat-form-field>
        </div>

        @if (calculatedHours() !== null) {
          <div class="calculated-hours">
            <mat-icon>schedule</mat-icon>
            <span>Duration: <strong>{{ calculatedHours() }}h</strong></span>
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
          [disabled]="!entryForm.valid">
          {{ isEditMode ? 'Update' : 'Create' }}
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
  private dialogRef = inject(MatDialogRef<TimeEntryModalComponent>);
  public data = inject<{ entry: TimeEntry | null }>(MAT_DIALOG_DATA);

  public isLoading = signal<boolean>(false);
  public isEditMode: boolean = false;
  public availableIssues = signal<Issue[]>([]);
  public availableProjects = signal<Project[]>([]);

  public entryForm: FormGroup = this.fb.group({
    projectId: [null, Validators.required],
    issueId: [null], // Optional - can track time on project without specific issue
    description: ['', [Validators.maxLength(500)]],
    startTime: ['', Validators.required],
    endTime: ['']
  }, {
    validators: this.timeValidator
  });

  public calculatedHours = signal<string | null>(null);

  ngOnInit(): void {
    if (this.data.entry) {
      this.isEditMode = true;
      this.entryForm.patchValue({
        description: this.data.entry.description,
        startTime: this.formatDateTimeLocal(this.data.entry.startTime),
        endTime: this.data.entry.endTime ? this.formatDateTimeLocal(this.data.entry.endTime) : ''
      });
      this.entryForm.get('projectId')?.disable();
      this.entryForm.get('issueId')?.disable();
    } else {
      this.loadProjects();
    }

    // Watch for changes to calculate hours
    this.entryForm.valueChanges.subscribe(() => {
      this.calculateHours();
    });

    this.calculateHours();
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
    this.issueService.getIssues(projectId).subscribe({
      next: (issues) => {
        this.availableIssues.set(issues);
      },
      error: (error) => {
        console.error('Error loading issues:', error);
      }
    });
  }

  timeValidator(form: FormGroup) {
    const startTime = form.get('startTime')?.value;
    const endTime = form.get('endTime')?.value;

    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return { endBeforeStart: true };
    }
    return null;
  }

  calculateHours(): void {
    const startTime = this.entryForm.get('startTime')?.value;
    const endTime = this.entryForm.get('endTime')?.value;

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
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

  formatDateTimeLocal(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onSave(): void {
    if (!this.entryForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const formData = { ...this.entryForm.value };

    // Convert to ISO strings
    if (formData.startTime) {
      formData.startTime = new Date(formData.startTime).toISOString();
    }
    if (formData.endTime) {
      formData.endTime = new Date(formData.endTime).toISOString();
    } else {
      delete formData.endTime;
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
        Swal.fire({
          title: 'Success!',
          text: `Time entry ${this.isEditMode ? 'updated' : 'created'} successfully`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.dialogRef.close(entry);
      },
      error: (error) => {
        console.error('Error saving time entry:', error);
        this.isLoading.set(false);

        let errorMessage = `Failed to ${this.isEditMode ? 'update' : 'create'} time entry. Please try again.`;
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

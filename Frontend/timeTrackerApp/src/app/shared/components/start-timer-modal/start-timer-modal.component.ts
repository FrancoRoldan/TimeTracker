import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '../../../project/services/project.service';
import { IssueService } from '../../../issue/services/issue.service';
import { TimeEntryService } from '../../../time-entry/services/time-entry.service';
import { Project } from '../../../project/interfaces';
import { Issue } from '../../../issue/interfaces';
import { CompanyService } from '../../../company/services/company.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../utils/error-handler.util';

@Component({
  selector: 'app-start-timer-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Iniciar temporizador</h2>
    <mat-dialog-content>
      <form [formGroup]="timerForm" class="form-content">
        <!-- Project Selection -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Proyecto</mat-label>
          <mat-select formControlName="projectId" (selectionChange)="onProjectChange($event.value)">
            @if (isLoadingProjects()) {
              <mat-option disabled>Cargando proyectos...</mat-option>
            }
            @for (project of projects(); track project.id) {
              <mat-option [value]="project.id">{{ project.name }}</mat-option>
            }
          </mat-select>
          @if (timerForm.get('projectId')?.hasError('required') && timerForm.get('projectId')?.touched) {
            <mat-error>El proyecto es obligatorio</mat-error>
          }
        </mat-form-field>

        <!-- Issue Selection (Optional) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Problema (opcional)</mat-label>
          <mat-select formControlName="issueId" [disabled]="!timerForm.get('projectId')?.value">
            <mat-option [value]="null">Sin problema específico</mat-option>
            @if (isLoadingIssues()) {
              <mat-option disabled>Cargando problemas...</mat-option>
            }
            @for (issue of issues(); track issue.id) {
              <mat-option [value]="issue.id">{{ issue.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Description (Optional) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción (opcional)</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Agrega notas sobre en qué estás trabajando..."></textarea>
        </mat-form-field>
      </form>

      @if (isSubmitting()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="40"></mat-spinner>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isSubmitting()">Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onStartTimer()"
        [disabled]="timerForm.invalid || isSubmitting()">
        <mat-icon>play_arrow</mat-icon>
        Iniciar temporizador
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      min-height: 300px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 12px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 20px;
    }

    mat-dialog-content {
      min-width: 450px;
      max-height: 70vh;
      overflow-y: auto;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
    }

    @media (max-width: 768px) {
      mat-dialog-content {
        min-width: 300px;
      }
    }
  `]
})
export class StartTimerModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<StartTimerModalComponent>);
  private projectService = inject(ProjectService);
  private issueService = inject(IssueService);
  private timeEntryService = inject(TimeEntryService);
  private companyService = inject(CompanyService);
  private dialog = inject(MatDialog);

  public timerForm!: FormGroup;
  public projects = signal<Project[]>([]);
  public issues = signal<Issue[]>([]);
  public isLoadingProjects = signal<boolean>(false);
  public isLoadingIssues = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public selectedCompany = signal<any>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadProjects();
    this.companyService.selectedCompany$.subscribe(company => {
      this.selectedCompany.set(company);
      if (company) {
        this.loadIssues(company.id);
      }
    });
  }

  private initForm(): void {
    this.timerForm = this.fb.group({
      projectId: [null, Validators.required],
      issueId: [null], // Optional - can track time on project without specific issue
      description: ['']
    });
  }

  private loadProjects(): void {
    this.isLoadingProjects.set(true);
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoadingProjects.set(false);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.isLoadingProjects.set(false);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to load projects')
          } as ErrorDialogData
        });
      }
    });
  }

  onProjectChange(projectId: number): void {
    // Reset issue selection when project changes
    this.timerForm.patchValue({ issueId: null });
    this.issues.set([]);

    if (projectId) {
      this.loadIssues(this.selectedCompany().id);
    }
  }

  private loadIssues(projectId: number): void {
    this.isLoadingIssues.set(true);
    this.issueService.getMyIssues(projectId).subscribe({
      next: (issues) => {
        this.issues.set(issues);
        this.isLoadingIssues.set(false);
      },
      error: (error) => {
        console.error('Error loading issues:', error);
        this.isLoadingIssues.set(false);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to load issues')
          } as ErrorDialogData
        });
      }
    });
  }

  onStartTimer(): void {
    if (this.timerForm.invalid) return;

    const formValue = this.timerForm.value;
    this.isSubmitting.set(true);

    // Send either issueId OR projectId
    const request: any = {
      description: formValue.description || undefined
    };

    if (formValue.issueId) {
      request.issueId = formValue.issueId;
    } else if (formValue.projectId) {
      request.projectId = formValue.projectId;
    }

    this.timeEntryService.startTimer(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Timer Started!',
            message: 'Your timer is now running'
          } as ErrorDialogData
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error starting timer:', error);
        this.isSubmitting.set(false);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to start timer. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

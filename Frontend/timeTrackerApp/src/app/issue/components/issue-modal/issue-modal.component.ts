import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IssueService } from '../../services/issue.service';
import { Issue } from '../../interfaces';
import { IssueStatus, IssueType, IssuePriority } from '../../../core/enums';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import { CompanyService } from '../../../company/services/company.service';
import { CompanyUser } from '../../../company/interfaces';
import { ProjectService } from '../../../project/services/project.service';
import { Project } from '../../../project/interfaces';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-issue-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    EnumLabelPipe
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Editar incidencia' : 'Crear incidencia' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="issueForm" class="form-content">
        @if (!data.projectId) {
          <mat-form-field class="full-width" appearance="fill">
            <mat-label>Proyecto</mat-label>
            <mat-select formControlName="projectId" required>
              <mat-option [value]="null">
                <em>Selecciona un proyecto</em>
              </mat-option>
              @for (project of projects(); track project.id) {
                <mat-option [value]="project.id">
                  {{ project.name }}
                </mat-option>
              }
            </mat-select>
            @if (issueForm.get('projectId')?.hasError('required') && issueForm.get('projectId')?.touched) {
              <mat-error>El proyecto es obligatorio</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" placeholder="Introduce el título de la incidencia" required>
          @if (issueForm.get('title')?.hasError('required') && issueForm.get('title')?.touched) {
            <mat-error>El título es obligatorio</mat-error>
          }
          @if (issueForm.get('title')?.hasError('maxlength')) {
            <mat-error>El título no puede exceder 200 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Descripción</mat-label>
          <textarea
            matInput
            formControlName="description"
            placeholder="Introduce la descripción de la incidencia"
            rows="4">
          </textarea>
          @if (issueForm.get('description')?.hasError('maxlength')) {
            <mat-error>La descripción no puede exceder 1000 caracteres</mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="fill">
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="type" required>
              <mat-option [value]="IssueType.UserStory">
                {{ IssueType.UserStory | enumLabel:'IssueType' }}
              </mat-option>
              <mat-option [value]="IssueType.Bug">
                {{ IssueType.Bug | enumLabel:'IssueType' }}
              </mat-option>
              <mat-option [value]="IssueType.Task">
                {{ IssueType.Task | enumLabel:'IssueType' }}
              </mat-option>
            </mat-select>
            @if (issueForm.get('type')?.hasError('required') && issueForm.get('type')?.touched) {
              <mat-error>El tipo es obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="status" required>
              <mat-option [value]="IssueStatus.ToDo">
                {{ IssueStatus.ToDo | enumLabel:'IssueStatus' }}
              </mat-option>
              <mat-option [value]="IssueStatus.InProgress">
                {{ IssueStatus.InProgress | enumLabel:'IssueStatus' }}
              </mat-option>
              <mat-option [value]="IssueStatus.Testing">
                {{ IssueStatus.Testing | enumLabel:'IssueStatus' }}
              </mat-option>
              <mat-option [value]="IssueStatus.Done">
                {{ IssueStatus.Done | enumLabel:'IssueStatus' }}
              </mat-option>
            </mat-select>
            @if (issueForm.get('status')?.hasError('required') && issueForm.get('status')?.touched) {
              <mat-error>El estado es obligatorio</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="fill">
            <mat-label>Prioridad</mat-label>
            <mat-select formControlName="priority" required>
              <mat-option [value]="IssuePriority.Low">
                {{ IssuePriority.Low | enumLabel:'IssuePriority' }}
              </mat-option>
              <mat-option [value]="IssuePriority.Medium">
                {{ IssuePriority.Medium | enumLabel:'IssuePriority' }}
              </mat-option>
              <mat-option [value]="IssuePriority.High">
                {{ IssuePriority.High | enumLabel:'IssuePriority' }}
              </mat-option>
              <mat-option [value]="IssuePriority.Critical">
                {{ IssuePriority.Critical | enumLabel:'IssuePriority' }}
              </mat-option>
            </mat-select>
            @if (issueForm.get('priority')?.hasError('required') && issueForm.get('priority')?.touched) {
              <mat-error>La prioridad es obligatoria</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Horas estimadas</mat-label>
            <input
              matInput
              type="number"
              formControlName="estimatedHours"
              placeholder="Opcional"
              min="0"
              step="0.5">
            @if (issueForm.get('estimatedHours')?.hasError('min')) {
              <mat-error>Las horas deben ser positivas</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field class="full-width" appearance="fill">
          <mat-label>Asignar a</mat-label>
          <mat-select formControlName="assignedUserId">
            <mat-option [value]="null">Sin asignar</mat-option>
            @if (companyUsers().length === 0) {
              <mat-option [value]="null" disabled>
                <em>{{ issueForm.get('projectId')?.value ? 'No se encontraron usuarios en esta empresa' : 'Selecciona primero un proyecto' }}</em>
              </mat-option>
            }
            @for (user of companyUsers(); track user.userId) {
              <mat-option [value]="user.userId">
                {{ user.userName }} ({{ user.userEmail }})
              </mat-option>
            }
          </mat-select>
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
          [disabled]="!issueForm.valid">
          {{ isEditMode ? 'Update' : 'Create' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
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
export class IssueModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private issueService = inject(IssueService);
  private companyService = inject(CompanyService);
  private projectService = inject(ProjectService);
  private dialogRef = inject(MatDialogRef<IssueModalComponent>);
  public data = inject<{ issue: Issue | null; projectId?: number }>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public isLoading = signal<boolean>(false);
  public companyUsers = signal<CompanyUser[]>([]);
  public projects = signal<Project[]>([]);
  public isEditMode: boolean = false;
  public IssueStatus = IssueStatus;
  public IssueType = IssueType;
  public IssuePriority = IssuePriority;

  public issueForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]],
    type: [IssueType.Task, Validators.required],
    status: [IssueStatus.ToDo, Validators.required],
    priority: [IssuePriority.Medium, Validators.required],
    estimatedHours: [null, [Validators.min(0)]],
    assignedUserId: [null],
    projectId: [this.data.projectId || null, Validators.required]
  });

  ngOnInit(): void {
    if (this.data.issue) {
      this.isEditMode = true;
      this.issueForm.patchValue({
        title: this.data.issue.title,
        description: this.data.issue.description,
        type: this.data.issue.type,
        status: this.data.issue.status,
        priority: this.data.issue.priority,
        estimatedHours: this.data.issue.estimatedHours,
        assignedUserId: this.data.issue.assignedUserId,
        projectId: this.data.issue.projectId
      });
    }

    // Get the effective projectId (from data.projectId or data.issue.projectId)
    const effectiveProjectId = this.data.projectId || this.data.issue?.projectId;

    // Load projects if no projectId provided
    if (!effectiveProjectId) {
      this.loadProjects();
    } else {
      // Load company users for assignee dropdown
      this.loadCompanyUsers();
    }

    // Listen for project changes to reload users
    this.issueForm.get('projectId')?.valueChanges.subscribe(projectId => {
      if (projectId) {
        this.loadCompanyUsers();
      } else {
        this.companyUsers.set([]);
      }
    });
  }

  onSave(): void {
    if (!this.issueForm.valid) {
      return;
    }

    this.isLoading.set(true);

    const formData = { ...this.issueForm.value };

    // Remove empty description
    if (!formData.description) {
      delete formData.description;
    }

    // Remove null EstimatedHours
    if (formData.estimatedHours === null) {
      delete formData.estimatedHours;
    }

    if (formData.assignedUserId === null)
      formData.assignedUserId = -1;

    const request$ = this.isEditMode
      ? this.issueService.updateIssue(this.data.issue!.id, formData)
      : this.issueService.createIssue(formData);

    request$.subscribe({
      next: (issue) => {
        this.isLoading.set(false);
        this.toastService.showSuccess(`Issue "${issue.title}" ${this.isEditMode ? 'updated' : 'created'} successfully`);
        this.dialogRef.close(issue);
      },
      error: (error) => {
        console.error('Error saving issue:', error);
        this.isLoading.set(false);

        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, `Failed to ${this.isEditMode ? 'update' : 'create'} issue. Please try again.`)
          } as ErrorDialogData
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  private loadProjects(): void {
    this.companyService.selectedCompany$.subscribe(company => {
      if (company?.id) {
        this.projectService.getProjects(company.id).subscribe({
          next: (projects) => this.projects.set(projects),
          error: (error) => console.error('Error loading projects:', error)
        });
      }
    });
  }

  private loadCompanyUsers(): void {
    const projectId = this.issueForm.get('projectId')?.value;
    if (!projectId) {
      console.log('No projectId available, cannot load users');
      return;
    }

    console.log('Loading users for projectId:', projectId);
    this.projectService.getProjectById(projectId).subscribe({
      next: (project) => {
        console.log('Project loaded:', project);
        console.log('Loading users for companyId:', project.companyId);
        this.companyService.getCompanyUsers(project.companyId).subscribe({
          next: (users) => {
            console.log('Users loaded:', users);
            this.companyUsers.set(users);
          },
          error: (error) => console.error('Error loading users:', error)
        });
      },
      error: (error) => console.error('Error loading project:', error)
    });
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { IssueService } from '../../services/issue.service';
import { ProjectService } from '../../../project/services/project.service';
import { Issue } from '../../interfaces';
import { IssueStatus, IssueType, IssuePriority } from '../../../core/enums';
import { IssueCardComponent } from '../issue-card/issue-card.component';
import { IssueModalComponent } from '../issue-modal/issue-modal.component';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import { CompanyService } from '../../../company/services/company.service';
import { Company } from '../../../company/interfaces/company.interface';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component.component';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    IssueCardComponent,
    EnumLabelPipe
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <h1>Incidencias</h1>
          <p class="subtitle">Gestiona tareas, bugs e historias de usuario del proyecto</p>
        </div>
        <button
          mat-raised-button
          color="primary"
          (click)="openCreateModal()"
          >
          <mat-icon>add</mat-icon>
          Nueva incidencia
        </button>
      </div>

        <div class="filters">
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Buscar incidencias</mat-label>
            <input
              matInput
              [value]="searchTerm()"
              (input)="onSearchChange($event)"
              placeholder="Buscar por título...">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filtrar por estado</mat-label>
            <mat-select [value]="selectedStatus()" (selectionChange)="onStatusChange($event.value)">
              <mat-option [value]="null">Todos los estados</mat-option>
              <mat-option [value]="IssueStatus.ToDo">{{ IssueStatus.ToDo | enumLabel:'IssueStatus' }}</mat-option>
              <mat-option [value]="IssueStatus.InProgress">{{ IssueStatus.InProgress | enumLabel:'IssueStatus' }}</mat-option>
              <mat-option [value]="IssueStatus.Testing">{{ IssueStatus.Testing | enumLabel:'IssueStatus' }}</mat-option>
              <mat-option [value]="IssueStatus.Done">{{ IssueStatus.Done | enumLabel:'IssueStatus' }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filtrar por tipo</mat-label>
            <mat-select [value]="selectedType()" (selectionChange)="onTypeChange($event.value)">
              <mat-option [value]="null">Todos los tipos</mat-option>
              <mat-option [value]="IssueType.UserStory">{{ IssueType.UserStory | enumLabel:'IssueType' }}</mat-option>
              <mat-option [value]="IssueType.Bug">{{ IssueType.Bug | enumLabel:'IssueType' }}</mat-option>
              <mat-option [value]="IssueType.Task">{{ IssueType.Task | enumLabel:'IssueType' }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filtrar por prioridad</mat-label>
            <mat-select [value]="selectedPriority()" (selectionChange)="onPriorityChange($event.value)">
              <mat-option [value]="null">Todas las prioridades</mat-option>
              <mat-option [value]="IssuePriority.Low">{{ IssuePriority.Low | enumLabel:'IssuePriority' }}</mat-option>
              <mat-option [value]="IssuePriority.Medium">{{ IssuePriority.Medium | enumLabel:'IssuePriority' }}</mat-option>
              <mat-option [value]="IssuePriority.High">{{ IssuePriority.High | enumLabel:'IssuePriority' }}</mat-option>
              <mat-option [value]="IssuePriority.Critical">{{ IssuePriority.Critical | enumLabel:'IssuePriority' }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="results-info">
          <span>{{ filteredIssues().length }} {{ filteredIssues().length === 1 ? 'incidencia encontrada' : 'incidencias encontradas' }}</span>
        </div>

        @if (isLoading()) {
          <div class="loading-spinner">
            <mat-spinner [diameter]="50"></mat-spinner>
          </div>
        } @else if (filteredIssues().length === 0) {
          <div class="no-data">
            <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">assignment</mat-icon>
            <h2>No se encontraron incidencias</h2>
            <p>{{ searchTerm() || selectedStatus() !== null || selectedType() !== null || selectedPriority() !== null ? 'Prueba ajustando tus filtros' : 'Crea tu primera incidencia para empezar' }}</p>
          </div>
        } @else {
          <div class="issues-grid">
            @for (issue of filteredIssues(); track issue.id) {
              <app-issue-card
                [issue]="issue"
                (viewIssue)="viewIssue($event)"
                (editIssue)="editIssue($event)"
                (deleteIssue)="confirmDelete($event)">
              </app-issue-card>
            }
          </div>
        }
      
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
    }

    .header-left h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .subtitle {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    mat-form-field {
      min-width: 160px;
    }

    .results-info {
      margin-bottom: 16px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .no-data {
      text-align: center;
      padding: 60px 40px;
      background-color: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      border-radius: 8px;
      margin: 20px 0;
    }

    .no-data h2 {
      margin: 16px 0 8px 0;
      font-size: 24px;
      font-weight: 500;
    }

    .no-data p {
      margin: 0;
      font-size: 16px;
      opacity: 0.8;
    }

    .issues-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
      }

      .filters {
        flex-direction: column;
      }

      .search-field {
        width: 100%;
      }

      mat-form-field {
        width: 100%;
      }

      .issues-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class IssueListComponent implements OnInit {
  private router = inject(Router);
  private issueService = inject(IssueService);
  private companyService = inject(CompanyService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public issues = signal<Issue[]>([]);
  public isLoading = signal<boolean>(false);
  public searchTerm = signal<string>('');
  public selectedStatus = signal<IssueStatus | null>(null);
  public selectedType = signal<IssueType | null>(null);
  public selectedPriority = signal<IssuePriority | null>(null);
  public selectedCompany = signal<any>(null);

  public IssueStatus = IssueStatus;
  public IssueType = IssueType;
  public IssuePriority = IssuePriority;

  public filteredIssues = computed(() => {
    let filtered = this.issues();

    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(term)
      );
    }

    if (this.selectedStatus() !== null) {
      filtered = filtered.filter(issue => issue.status === this.selectedStatus());
    }

    if (this.selectedType() !== null) {
      filtered = filtered.filter(issue => issue.type === this.selectedType());
    }

    if (this.selectedPriority() !== null) {
      filtered = filtered.filter(issue => issue.priority === this.selectedPriority());
    }

    return filtered;
  });

  ngOnInit(): void {
    this.companyService.selectedCompany$.subscribe(company => {
      this.selectedCompany.set(company);
      if (company) {
        this.loadIssues(company.id);
      }
    });
  }

  loadIssues(idCompany: number): void {
    this.isLoading.set(true);
    this.issueService.getIssues(idCompany).subscribe({
      next: (issues) => {
        this.issues.set(issues);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading issues:', error);
        this.isLoading.set(false);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to load issues. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onStatusChange(status: IssueStatus | null): void {
    this.selectedStatus.set(status);
  }

  onTypeChange(type: IssueType | null): void {
    this.selectedType.set(type);
  }

  onPriorityChange(priority: IssuePriority | null): void {
    this.selectedPriority.set(priority);
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '900px',
      data: { issue: null, projectId: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIssues(this.selectedCompany().id);
      }
    });
  }

  viewIssue(issue: Issue): void {
    this.router.navigate(['/issues', issue.id]);
  }

  editIssue(issue: Issue): void {
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '900px',
      data: { issue, projectId: issue.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIssues(this.selectedCompany().id);
      }
    });
  }

  confirmDelete(issue: Issue): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Issue?',
        message: `Are you sure you want to delete "${issue.title}"? This action cannot be undone.`
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteIssue(issue.id);
      }
    });
  }

  deleteIssue(issueId: number): void {
    this.issueService.deleteIssue(issueId).subscribe({
      next: () => {
        this.toastService.showSuccess('Issue has been deleted.');
        this.loadIssues(this.selectedCompany().id);
      },
      error: (error) => {
        console.error('Error deleting issue:', error);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to delete issue. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }
}

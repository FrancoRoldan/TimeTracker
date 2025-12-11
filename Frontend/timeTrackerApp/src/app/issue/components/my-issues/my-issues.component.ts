import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { IssueService } from '../../services/issue.service';
import { Issue } from '../../interfaces';
import { IssueStatus, IssueType, IssuePriority } from '../../../core/enums';
import { IssueCardComponent } from '../issue-card/issue-card.component';
import { IssueModalComponent } from '../issue-modal/issue-modal.component';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import Swal from 'sweetalert2';
import { CompanyService } from '../../../company/services/company.service';

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    IssueCardComponent,
    EnumLabelPipe
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <mat-icon class="header-icon" color="primary">person</mat-icon>
          <div>
            <h1>Mis incidencias</h1>
            <p class="subtitle">Incidencias asignadas a ti</p>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="refreshIssues()">
          <mat-icon>refresh</mat-icon>
          Actualizar
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
          <mat-label>Filtrar por prioridad</mat-label>
          <mat-select [value]="selectedPriority()" (selectionChange)="onPriorityChange($event.value)">
            <mat-option [value]="null">Todas las prioridades</mat-option>
            <mat-option [value]="IssuePriority.Critical">{{ IssuePriority.Critical | enumLabel:'IssuePriority' }}</mat-option>
            <mat-option [value]="IssuePriority.High">{{ IssuePriority.High | enumLabel:'IssuePriority' }}</mat-option>
            <mat-option [value]="IssuePriority.Medium">{{ IssuePriority.Medium | enumLabel:'IssuePriority' }}</mat-option>
            <mat-option [value]="IssuePriority.Low">{{ IssuePriority.Low | enumLabel:'IssuePriority' }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon" style="color: #757575;">assignment</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ myIssues().length }}</span>
                <span class="stat-label">Total de incidencias</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon" style="color: #2196f3;">play_circle</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ countByStatus(IssueStatus.InProgress) }}</span>
                <span class="stat-label">En progreso</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon" style="color: #f44336;">priority_high</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ countByPriority(IssuePriority.High) + countByPriority(IssuePriority.Critical) }}</span>
                <span class="stat-label">Alta prioridad</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon" style="color: #4caf50;">check_circle</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ countByStatus(IssueStatus.Done) }}</span>
                <span class="stat-label">Completadas</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
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
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">inbox</mat-icon>
          <h2>No se encontraron incidencias</h2>
          <p>{{ myIssues().length === 0 ? 'No tienes incidencias asignadas' : 'Prueba ajustando tus filtros' }}</p>
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

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background-color: var(--mat-sys-surface);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
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

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .issues-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MyIssuesComponent implements OnInit {
  private router = inject(Router);
  private issueService = inject(IssueService);
  private dialog = inject(MatDialog);
  private companyService = inject(CompanyService);

  public myIssues = signal<Issue[]>([]);
  public isLoading = signal<boolean>(false);
  public searchTerm = signal<string>('');
  public selectedStatus = signal<IssueStatus | null>(null);
  public selectedPriority = signal<IssuePriority | null>(null);
  public selectedCompany = signal<any>(null);

  public IssueStatus = IssueStatus;
  public IssuePriority = IssuePriority;

  public filteredIssues = computed(() => {
    let filtered = this.myIssues();

    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(term)
      );
    }

    if (this.selectedStatus() !== null) {
      filtered = filtered.filter(issue => issue.status === this.selectedStatus());
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
        this.loadMyIssues(company.id);
      }
    });
  }

  loadMyIssues(companyId: number): void {
    this.isLoading.set(true);
    this.issueService.getMyIssues(companyId).subscribe({
      next: (issues) => {
        this.myIssues.set(issues);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading my issues:', error);
        this.isLoading.set(false);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load your issues. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  refreshIssues(): void {
    this.loadMyIssues(this.selectedCompany().id);
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onStatusChange(status: IssueStatus | null): void {
    this.selectedStatus.set(status);
  }

  onPriorityChange(priority: IssuePriority | null): void {
    this.selectedPriority.set(priority);
  }

  countByStatus(status: IssueStatus): number {
    return this.myIssues().filter(issue => issue.status === status).length;
  }

  countByPriority(priority: IssuePriority): number {
    return this.myIssues().filter(issue => issue.priority === priority).length;
  }

  viewIssue(issue: Issue): void {
    this.router.navigate(['/issues', issue.id]);
  }

  editIssue(issue: Issue): void {
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '700px',
      data: { issue, projectId: issue.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMyIssues(this.selectedCompany().id);
      }
    });
  }

  confirmDelete(issue: Issue): void {
    Swal.fire({
      title: 'Delete Issue?',
      text: `Are you sure you want to delete "${issue.title}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteIssue(issue.id);
      }
    });
  }

  deleteIssue(issueId: number): void {
    this.issueService.deleteIssue(issueId).subscribe({
      next: () => {
        Swal.fire({
          title: 'Deleted!',
          text: 'Issue has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.loadMyIssues(this.selectedCompany().id);
      },
      error: (error) => {
        console.error('Error deleting issue:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete issue. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }
}

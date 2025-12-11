import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { IssueService } from '../../../issue/services/issue.service';
import { Issue } from '../../../issue/interfaces';
import { IssueStatus, IssueType, IssuePriority } from '../../../core/enums';
import { IssueCardComponent } from '../../../issue/components/issue-card/issue-card.component';
import { IssueModalComponent } from '../../../issue/components/issue-modal/issue-modal.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-project-issues',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    IssueCardComponent
  ],
  template: `
    <div class="issues-container">
      <!-- Header -->
      <div class="header">
        <h2>Project Issues</h2>
        <button mat-raised-button color="primary" (click)="openCreateModal()">
          <mat-icon>add</mat-icon>
          New Issue
        </button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <mat-form-field class="search-field">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="searchTerm" placeholder="Search by title">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter">
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="IssueStatus.ToDo">To Do</mat-option>
            <mat-option [value]="IssueStatus.InProgress">In Progress</mat-option>
            <mat-option [value]="IssueStatus.Testing">Testing</mat-option>
            <mat-option [value]="IssueStatus.Done">Done</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="typeFilter">
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="IssueType.Bug">Bug</mat-option>
            <mat-option [value]="IssueType.Task">Task</mat-option>
            <mat-option [value]="IssueType.UserStory">User Story</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Priority</mat-label>
          <mat-select [(ngModel)]="priorityFilter">
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="IssuePriority.Low">Low</mat-option>
            <mat-option [value]="IssuePriority.Medium">Medium</mat-option>
            <mat-option [value]="IssuePriority.High">High</mat-option>
            <mat-option [value]="IssuePriority.Critical">Critical</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Issues Grid -->
      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (filteredIssues().length > 0) {
        <div class="issues-grid">
          @for (issue of filteredIssues(); track issue.id) {
            <app-issue-card
              [issue]="issue"
              (viewIssue)="viewIssue($event)"
              (editIssue)="openEditModal($event)"
              (deleteIssue)="confirmDeleteIssue($event)"
            />
          }
        </div>
      } @else {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">assignment</mat-icon>
          <h3>No issues found</h3>
          <p>There are no issues for this project yet. Create your first issue to get started.</p>
          <button mat-raised-button color="primary" (click)="openCreateModal()">
            <mat-icon>add</mat-icon>
            Create Issue
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .issues-container {
      padding: 20px 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    .issues-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 12px;
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

    .no-data h3 {
      margin: 16px 0 8px 0;
      font-size: 20px;
      font-weight: 500;
    }

    .no-data p {
      margin: 0 0 24px 0;
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .filters {
        flex-direction: column;
      }

      .issues-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProjectIssuesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private issueService = inject(IssueService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public issues = signal<Issue[]>([]);
  public isLoading = signal<boolean>(false);

  public searchTerm = signal<string>('');
  public statusFilter = signal<IssueStatus | null>(null);
  public typeFilter = signal<IssueType | null>(null);
  public priorityFilter = signal<IssuePriority | null>(null);

  public filteredIssues = computed(() => {
    let filtered = this.issues();

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(search)
      );
    }

    const status = this.statusFilter();
    if (status !== null) {
      filtered = filtered.filter(issue => issue.status === status);
    }

    const type = this.typeFilter();
    if (type !== null) {
      filtered = filtered.filter(issue => issue.type === type);
    }

    const priority = this.priorityFilter();
    if (priority !== null) {
      filtered = filtered.filter(issue => issue.priority === priority);
    }

    return filtered;
  });

  // Expose enums for template
  public readonly IssueStatus = IssueStatus;
  public readonly IssueType = IssueType;
  public readonly IssuePriority = IssuePriority;

  private projectId: number = 0;

  ngOnInit(): void {
    // Get projectId from parent route
    this.projectId = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.loadIssues();
  }

  loadIssues(): void {
    this.isLoading.set(true);
    this.issueService.getIssuesByProject(this.projectId).subscribe({
      next: (issues: Issue[]) => {
        this.issues.set(issues);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading issues:', error);
        this.isLoading.set(false);
        this.toastService.showError('Failed to load issues');
      }
    });
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '600px',
      data: { projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIssues();
        this.toastService.showSuccess('Issue created successfully');
      }
    });
  }

  viewIssue(issue: Issue): void {
    this.router.navigate(['/issues', issue.id]);
  }

  openEditModal(issue: Issue): void {
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '600px',
      data: { issue, projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIssues();
        this.toastService.showSuccess('Issue updated successfully');
      }
    });
  }

  confirmDeleteIssue(issue: Issue): void {
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
        this.loadIssues();
        this.toastService.showSuccess('Issue deleted successfully');
      },
      error: (error: any) => {
        console.error('Error deleting issue:', error);
        this.toastService.showError('Failed to delete issue');
      }
    });
  }
}

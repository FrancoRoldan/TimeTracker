import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { IssueService } from '../../../issue/services/issue.service';
import { Issue } from '../../../issue/interfaces';
import { IssueStatus } from '../../../core/enums';
import { IssueCardComponent } from '../../../issue/components/issue-card/issue-card.component';
import { IssueModalComponent } from '../../../issue/components/issue-modal/issue-modal.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component.component';
import { ToastService } from '../../../shared/services/toast.service';

interface BoardColumn {
  id: IssueStatus;
  title: string;
  issues: Issue[];
}

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    IssueCardComponent
  ],
  template: `
    <div class="board-container">
      <!-- Header -->
      <div class="header">
        <h2>Project Board</h2>
        <button mat-raised-button color="primary" (click)="openCreateModal()">
          <mat-icon>add</mat-icon>
          New Issue
        </button>
      </div>

      <!-- Board -->
      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else {
        <div class="board-columns" cdkDropListGroup>
          @for (column of columns(); track column.id) {
            <div class="column">
              <div class="column-header">
                <h3>{{ column.title }}</h3>
                <span class="issue-count">{{ column.issues.length }}</span>
              </div>
              <div
                class="column-content"
                cdkDropList
                [cdkDropListData]="column.issues"
                (cdkDropListDropped)="onDrop($event, column.id)">
                @for (issue of column.issues; track issue.id) {
                  <div class="issue-card-wrapper" cdkDrag>
                    <app-issue-card
                      [issue]="issue"
                      (viewIssue)="viewIssue($event)"
                      (editIssue)="openEditModal($event)"
                      (deleteIssue)="confirmDeleteIssue($event)"
                    />
                  </div>
                }
                @if (column.issues.length === 0) {
                  <div class="empty-column">
                    <mat-icon>inbox</mat-icon>
                    <p>No issues</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .board-container {
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

    .board-columns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      min-height: 500px;
    }

    .column {
      background-color: var(--mat-sys-tertiary-container);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      min-height: 500px;
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .column-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--mat-sys-on-tertiary-container);
    }

    .issue-count {
      background-color: var(--mat-sys-on-tertiary-container);
      color: var(--mat-sys-tertiary-container);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 500;
    }

    .column-content {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
      min-height: 400px;
    }

    .issue-card-wrapper {
      margin-bottom: 8px;
    }

    .issue-card-wrapper.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .column-content.cdk-drop-list-dragging .issue-card-wrapper:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .empty-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--mat-sys-on-tertiary-container);
      opacity: 0.5;
    }

    .empty-column mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    .empty-column p {
      margin: 0;
      font-size: 14px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    @media (max-width: 1200px) {
      .board-columns {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .board-columns {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProjectIssueBoardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private issueService = inject(IssueService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public issues = signal<Issue[]>([]);
  public isLoading = signal<boolean>(false);
  public columns = signal<BoardColumn[]>([]);

  private projectId: number = 0;

  ngOnInit(): void {
    // Get projectId from parent route
    this.projectId = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.initializeColumns();
    this.loadIssues();
  }

  initializeColumns(): void {
    this.columns.set([
      { id: IssueStatus.ToDo, title: 'To Do', issues: [] },
      { id: IssueStatus.InProgress, title: 'In Progress', issues: [] },
      { id: IssueStatus.Testing, title: 'Testing', issues: [] },
      { id: IssueStatus.Done, title: 'Done', issues: [] }
    ]);
  }

  loadIssues(): void {
    this.isLoading.set(true);
    this.issueService.getIssuesByProject(this.projectId).subscribe({
      next: (issues: Issue[]) => {
        this.issues.set(issues);
        this.organizeIssuesByStatus(issues);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading issues:', error);
        this.isLoading.set(false);
        this.toastService.showError('Failed to load issues');
      }
    });
  }

  organizeIssuesByStatus(issues: Issue[]): void {
    const newColumns = this.columns().map(column => ({
      ...column,
      issues: issues.filter(issue => issue.status === column.id)
    }));
    this.columns.set(newColumns);
  }

  onDrop(event: CdkDragDrop<Issue[]>, newStatus: IssueStatus): void {
    const issue = event.previousContainer.data[event.previousIndex];

    if (event.previousContainer === event.container) {
      // Same column - just reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Different column - transfer and update status
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update issue status in backend
      this.updateIssueStatus(issue, newStatus);
    }
  }

  updateIssueStatus(issue: Issue, newStatus: IssueStatus): void {
    this.issueService.updateIssueStatus(issue.id, newStatus).subscribe({
      next: () => {
        this.toastService.showSuccess('Issue status updated');
      },
      error: (error) => {
        console.error('Error updating issue status:', error);
        this.toastService.showError('Failed to update issue status');
        // Reload to revert the UI change
        this.loadIssues();
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

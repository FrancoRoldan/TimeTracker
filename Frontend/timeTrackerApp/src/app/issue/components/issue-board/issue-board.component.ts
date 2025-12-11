import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { IssueService } from '../../services/issue.service';
import { ProjectService } from '../../../project/services/project.service';
import { Issue } from '../../interfaces';
import { IssueStatus, IssueType, IssuePriority } from '../../../core/enums';
import { IssueModalComponent } from '../issue-modal/issue-modal.component';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import { CompanyService } from '../../../company/services/company.service';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';

@Component({
  selector: 'app-issue-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    EnumLabelPipe
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <mat-icon class="header-icon" color="primary">view_kanban</mat-icon>
          <div>
            <h1>Tablero de incidencias</h1>
            <p class="subtitle">Vista Kanban para gestionar incidencias</p>
          </div>
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

       @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else {
        <div class="board">
          <!-- To Do Column -->
          <div class="board-column">
            <div class="column-header todo">
              <mat-icon>inbox</mat-icon>
              <h3>Por hacer</h3>
              <span class="count">{{ todoIssues().length }}</span>
            </div>
            <div
              class="column-content"
              cdkDropList
              #todoList="cdkDropList"
              [cdkDropListData]="todoIssues()"
              [cdkDropListConnectedTo]="[inProgressList, testingList, doneList]"
              (cdkDropListDropped)="drop($event, IssueStatus.ToDo)">
              @for (issue of todoIssues(); track issue.id) {
                <div class="issue-item" cdkDrag (click)="viewIssue(issue)">
                  <div class="issue-header">
                    <mat-icon class="type-icon" [style.color]="getTypeColor(issue.type)">
                      {{ getTypeIcon(issue.type) }}
                    </mat-icon>
                    <span class="priority-badge" [style.background-color]="getPriorityColor(issue.priority)">
                      {{ issue.priority | enumLabel:'IssuePriority' }}
                    </span>
                  </div>
                  <h4 class="issue-title">{{ issue.title }}</h4>
                  <div class="issue-footer">
                    <span class="project-name">{{ issue.projectName }}</span>
                    @if (issue.assignedUserName) {
                      <div class="assignee">
                        <mat-icon>person</mat-icon>
                        <span>{{ issue.assignedUserName }}</span>
                      </div>
                    }
                  </div>
                </div>
              } @empty {
                <div class="empty-column">
                  <mat-icon>inbox</mat-icon>
                  <p>No hay incidencias</p>
                </div>
              }
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="board-column">
            <div class="column-header in-progress">
              <mat-icon>play_circle</mat-icon>
              <h3>En progreso</h3>
              <span class="count">{{ inProgressIssues().length }}</span>
            </div>
            <div
              class="column-content"
              cdkDropList
              #inProgressList="cdkDropList"
              [cdkDropListData]="inProgressIssues()"
              [cdkDropListConnectedTo]="[todoList, testingList, doneList]"
              (cdkDropListDropped)="drop($event, IssueStatus.InProgress)">
              @for (issue of inProgressIssues(); track issue.id) {
                <div class="issue-item" cdkDrag (click)="viewIssue(issue)">
                  <div class="issue-header">
                    <mat-icon class="type-icon" [style.color]="getTypeColor(issue.type)">
                      {{ getTypeIcon(issue.type) }}
                    </mat-icon>
                    <span class="priority-badge" [style.background-color]="getPriorityColor(issue.priority)">
                      {{ issue.priority | enumLabel:'IssuePriority' }}
                    </span>
                  </div>
                  <h4 class="issue-title">{{ issue.title }}</h4>
                  <div class="issue-footer">
                    <span class="project-name">{{ issue.projectName }}</span>
                    @if (issue.assignedUserName) {
                      <div class="assignee">
                        <mat-icon>person</mat-icon>
                        <span>{{ issue.assignedUserName }}</span>
                      </div>
                    }
                  </div>
                </div>
              } @empty {
                <div class="empty-column">
                  <mat-icon>play_circle</mat-icon>
                  <p>No hay incidencias</p>
                </div>
              }
            </div>
          </div>

          <!-- Testing Column -->
          <div class="board-column">
            <div class="column-header testing">
              <mat-icon>science</mat-icon>
              <h3>En pruebas</h3>
              <span class="count">{{ testingIssues().length }}</span>
            </div>
            <div
              class="column-content"
              cdkDropList
              #testingList="cdkDropList"
              [cdkDropListData]="testingIssues()"
              [cdkDropListConnectedTo]="[todoList, inProgressList, doneList]"
              (cdkDropListDropped)="drop($event, IssueStatus.Testing)">
              @for (issue of testingIssues(); track issue.id) {
                <div class="issue-item" cdkDrag (click)="viewIssue(issue)">
                  <div class="issue-header">
                    <mat-icon class="type-icon" [style.color]="getTypeColor(issue.type)">
                      {{ getTypeIcon(issue.type) }}
                    </mat-icon>
                    <span class="priority-badge" [style.background-color]="getPriorityColor(issue.priority)">
                      {{ issue.priority | enumLabel:'IssuePriority' }}
                    </span>
                  </div>
                  <h4 class="issue-title">{{ issue.title }}</h4>
                  <div class="issue-footer">
                    <span class="project-name">{{ issue.projectName }}</span>
                    @if (issue.assignedUserName) {
                      <div class="assignee">
                        <mat-icon>person</mat-icon>
                        <span>{{ issue.assignedUserName }}</span>
                      </div>
                    }
                  </div>
                </div>
              } @empty {
                <div class="empty-column">
                  <mat-icon>science</mat-icon>
                  <p>No hay incidencias</p>
                </div>
              }
            </div>
          </div>

          <!-- Done Column -->
          <div class="board-column">
            <div class="column-header done">
              <mat-icon>check_circle</mat-icon>
              <h3>Hecho</h3>
              <span class="count">{{ doneIssues().length }}</span>
            </div>
            <div
              class="column-content"
              cdkDropList
              #doneList="cdkDropList"
              [cdkDropListData]="doneIssues()"
              [cdkDropListConnectedTo]="[todoList, inProgressList, testingList]"
              (cdkDropListDropped)="drop($event, IssueStatus.Done)">
              @for (issue of doneIssues(); track issue.id) {
                <div class="issue-item" cdkDrag (click)="viewIssue(issue)">
                  <div class="issue-header">
                    <mat-icon class="type-icon" [style.color]="getTypeColor(issue.type)">
                      {{ getTypeIcon(issue.type) }}
                    </mat-icon>
                    <span class="priority-badge" [style.background-color]="getPriorityColor(issue.priority)">
                      {{ issue.priority | enumLabel:'IssuePriority' }}
                    </span>
                  </div>
                  <h4 class="issue-title">{{ issue.title }}</h4>
                  <div class="issue-footer">
                    <span class="project-name">{{ issue.projectName }}</span>
                    @if (issue.assignedUserName) {
                      <div class="assignee">
                        <mat-icon>person</mat-icon>
                        <span>{{ issue.assignedUserName }}</span>
                      </div>
                    }
                  </div>
                </div>
              } @empty {
                <div class="empty-column">
                  <mat-icon>check_circle</mat-icon>
                  <p>No hay incidencias</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .container {
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
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

    .board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      flex: 1;
      overflow-x: auto;
      min-height: 0;
    }

    .board-column {
      display: flex;
      flex-direction: column;
      min-width: 280px;
      background-color: var(--mat-sys-surface-variant);
      border-radius: 8px;
      overflow: hidden;
    }

    .column-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      color: white;
      font-weight: 500;
    }

    .column-header.todo {
      background-color: #757575;
    }

    .column-header.in-progress {
      background-color: #2196f3;
    }

    .column-header.testing {
      background-color: #ff9800;
    }

    .column-header.done {
      background-color: #4caf50;
    }

    .column-header h3 {
      margin: 0;
      flex: 1;
      font-size: 16px;
    }

    .column-header .count {
      background-color: rgba(255, 255, 255, 0.3);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 14px;
    }

    .column-content {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      min-height: 200px;
    }

    .issue-item {
      background-color: var(--mat-sys-surface);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .issue-item:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .issue-item.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drag-preview {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      opacity: 0.8;
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .type-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .priority-badge {
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .issue-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      line-height: 1.3;
    }

    .issue-footer {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .project-name {
      font-weight: 500;
    }

    .assignee {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .assignee mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .empty-column {
      text-align: center;
      padding: 40px 20px;
      color: var(--mat-sys-on-surface-variant);
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

    @media (max-width: 1200px) {
      .board {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
      }

      .board {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class IssueBoardComponent implements OnInit {
  private router = inject(Router);
  private issueService = inject(IssueService);
  private companyService = inject(CompanyService);
  private dialog = inject(MatDialog);

  public issues = signal<Issue[]>([]);
  public isLoading = signal<boolean>(false);

  public IssueStatus = IssueStatus;
  public selectedCompany = signal<any>(null);

  public todoIssues = computed(() =>
    this.issues().filter(issue => issue.status === IssueStatus.ToDo)
  );

  public inProgressIssues = computed(() =>
    this.issues().filter(issue => issue.status === IssueStatus.InProgress)
  );

  public testingIssues = computed(() =>
    this.issues().filter(issue => issue.status === IssueStatus.Testing)
  );

  public doneIssues = computed(() =>
    this.issues().filter(issue => issue.status === IssueStatus.Done)
  );

  ngOnInit(): void {
    this.companyService.selectedCompany$.subscribe(company => {
      this.selectedCompany.set(company);
      if (company) {
        this.loadIssues(company.id);
      }
    });
  }

  loadIssues(companyId: number): void {
    this.isLoading.set(true);
    this.issueService.getMyIssues(companyId).subscribe({
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

  drop(event: CdkDragDrop<Issue[]>, newStatus: IssueStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const issue = event.previousContainer.data[event.previousIndex];

      // Update issue status via API
      this.issueService.updateIssueStatus(issue.id, newStatus).subscribe({
        next: (updatedIssue) => {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );

          // Update local issue data
          const allIssues = this.issues();
          const index = allIssues.findIndex(i => i.id === issue.id);
          if (index !== -1) {
            allIssues[index] = updatedIssue;
            this.issues.set([...allIssues]);
          }
        },
        error: (error) => {
          console.error('Error updating issue status:', error);
          this.dialog.open(ErrorDialogComponent, {
            data: {
              title: 'Error!',
              message: extractErrorMessage(error, 'Failed to update issue status. Please try again.')
            } as ErrorDialogData
          });
        }
      });
    }
  }

  openCreateModal(): void {
    
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '700px',
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

  getTypeIcon(type: IssueType): string {
    const icons: Record<IssueType, string> = {
      [IssueType.UserStory]: 'description',
      [IssueType.Bug]: 'bug_report',
      [IssueType.Task]: 'assignment'
    };
    return icons[type] || 'assignment';
  }

  getTypeColor(type: IssueType): string {
    const colors: Record<IssueType, string> = {
      [IssueType.UserStory]: '#2196f3',
      [IssueType.Bug]: '#f44336',
      [IssueType.Task]: '#9c27b0'
    };
    return colors[type] || '#757575';
  }

  getPriorityColor(priority: IssuePriority): string {
    const colors: Record<IssuePriority, string> = {
      [IssuePriority.Low]: '#4caf50',
      [IssuePriority.Medium]: '#ff9800',
      [IssuePriority.High]: '#f44336',
      [IssuePriority.Critical]: '#9c27b0'
    };
    return colors[priority] || '#757575';
  }
}

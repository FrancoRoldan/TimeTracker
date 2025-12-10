import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Issue } from '../../interfaces';
import { IssueStatus, IssueType, IssuePriority } from '../../../core/enums';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';

@Component({
  selector: 'app-issue-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    EnumLabelPipe
  ],
  template: `
    <mat-card class="issue-card">
      <mat-card-header>
        <mat-icon mat-card-avatar [color]="getTypeColor(issue().type)">{{ getTypeIcon(issue().type) }}</mat-icon>
        <mat-card-title>{{ issue().title }}</mat-card-title>
        <mat-card-subtitle>
          <div class="chips-container">
            <mat-chip [style.background-color]="getStatusColor(issue().status)">
              {{ issue().status | enumLabel:'IssueStatus' }}
            </mat-chip>
            <mat-chip [style.background-color]="getPriorityColor(issue().priority)">
              {{ issue().priority | enumLabel:'IssuePriority' }}
            </mat-chip>
          </div>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="issue-info">
          <div class="info-row">
            <mat-icon class="info-icon">folder</mat-icon>
            <span class="info-label">Project:</span>
            <span class="info-value">{{ issue().projectName }}</span>
          </div>

          @if (issue().assignedUserName) {
            <div class="info-row">
              <mat-icon class="info-icon">person</mat-icon>
              <span class="info-label">Assigned:</span>
              <span class="info-value">{{ issue().assignedUserName }}</span>
            </div>
          } @else {
            <div class="info-row">
              <mat-icon class="info-icon">person_outline</mat-icon>
              <span class="info-label">Assigned:</span>
              <span class="info-value unassigned">Unassigned</span>
            </div>
          }

          @if (issue().estimatedHours) {
            <div class="info-row">
              <mat-icon class="info-icon">schedule</mat-icon>
              <span class="info-label">Estimated:</span>
              <span class="info-value">{{ issue().estimatedHours }}h</span>
            </div>
          }

          @if (issue().description) {
            <div class="description">
              <p>{{ issue().description }}</p>
            </div>
          }
        </div>
      </mat-card-content>

      <mat-card-actions>
        <button mat-button color="primary" (click)="onView()">
          <mat-icon>visibility</mat-icon>
          View
        </button>
        <button mat-button (click)="onEdit()">
          <mat-icon>edit</mat-icon>
          Edit
        </button>
        <button mat-button color="warn" (click)="onDelete()">
          <mat-icon>delete</mat-icon>
          Delete
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    :host {
      display: block;
    }

    .issue-card {
      transition: transform 0.2s, box-shadow 0.2s;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .issue-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-content {
      flex: 1;
    }

    .chips-container {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    mat-chip {
      color: white;
      font-weight: 500;
      font-size: 11px;
      min-height: 24px;
      padding: 0 8px;
    }

    .issue-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-sys-primary);
    }

    .info-label {
      font-weight: 500;
      min-width: 70px;
    }

    .info-value {
      color: var(--mat-sys-on-surface);
    }

    .unassigned {
      font-style: italic;
      opacity: 0.7;
    }

    .description {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .description p {
      margin: 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    mat-card-actions {
      padding: 8px 16px 16px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  `]
})
export class IssueCardComponent {
  issue = input.required<Issue>();

  viewIssue = output<Issue>();
  editIssue = output<Issue>();
  deleteIssue = output<Issue>();

  onView(): void {
    this.viewIssue.emit(this.issue());
  }

  onEdit(): void {
    this.editIssue.emit(this.issue());
  }

  onDelete(): void {
    this.deleteIssue.emit(this.issue());
  }

  getTypeIcon(type: IssueType): string {
    const icons: Record<IssueType, string> = {
      [IssueType.UserStory]: 'description',
      [IssueType.Bug]: 'bug_report',
      [IssueType.Task]: 'assignment'
    };
    return icons[type] || 'assignment';
  }

  getTypeColor(type: IssueType): 'primary' | 'warn' | 'accent' {
    const colors: Record<IssueType, 'primary' | 'warn' | 'accent'> = {
      [IssueType.UserStory]: 'primary',
      [IssueType.Bug]: 'warn',
      [IssueType.Task]: 'accent'
    };
    return colors[type] || 'primary';
  }

  getStatusColor(status: IssueStatus): string {
    const colors: Record<IssueStatus, string> = {
      [IssueStatus.ToDo]: '#757575',
      [IssueStatus.InProgress]: '#2196f3',
      [IssueStatus.Testing]: '#ff9800',
      [IssueStatus.Done]: '#4caf50'
    };
    return colors[status] || '#757575';
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

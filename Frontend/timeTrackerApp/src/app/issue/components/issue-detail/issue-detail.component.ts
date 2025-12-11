import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { IssueService } from '../../services/issue.service';
import { TimeEntryService } from '../../../time-entry/services/time-entry.service';
import { Issue } from '../../interfaces';
import { TimeEntry } from '../../../time-entry/interfaces';
import { IssueStatus, IssueType, IssuePriority } from '../../../core/enums';
import { IssueModalComponent } from '../issue-modal/issue-modal.component';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component.component';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    EnumLabelPipe
  ],
  template: `
    <div class="container">
      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (issue()) {
        <div class="header">
          <div class="header-left">
            <button mat-icon-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div>
              <div class="title-row">
                <mat-icon [color]="getTypeColor(issue()!.type)" class="type-icon">
                  {{ getTypeIcon(issue()!.type) }}
                </mat-icon>
                <h1>{{ issue()!.title }}</h1>
              </div>
              <div class="chips-container">
                <mat-chip [style.background-color]="getStatusColor(issue()!.status)">
                  {{ issue()!.status | enumLabel:'IssueStatus' }}
                </mat-chip>
                <mat-chip [style.background-color]="getPriorityColor(issue()!.priority)">
                  {{ issue()!.priority | enumLabel:'IssuePriority' }}
                </mat-chip>
                <mat-chip class="type-chip">
                  {{ issue()!.type | enumLabel:'IssueType' }}
                </mat-chip>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="editIssue()">
              <mat-icon>edit</mat-icon>
              Editar
            </button>
            <button mat-raised-button color="warn" (click)="confirmDelete()">
              <mat-icon>delete</mat-icon>
              Eliminar
            </button>
          </div>
        </div>

        <div class="content-grid">
          <!-- Issue Information Card -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">info</mat-icon>
              <mat-card-title>Información de la incidencia</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-list">
                <div class="info-item">
                  <mat-icon class="info-icon">folder</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Proyecto</span>
                    <span class="info-value">{{ issue()!.projectName }}</span>
                  </div>
                </div>

                @if (issue()!.assignedUserName) {
                  <div class="info-item">
                    <mat-icon class="info-icon">person</mat-icon>
                    <div class="info-content">
                      <span class="info-label">Asignado a</span>
                      <span class="info-value">{{ issue()!.assignedUserName }}</span>
                    </div>
                  </div>
                } @else {
                  <div class="info-item">
                    <mat-icon class="info-icon">person_outline</mat-icon>
                    <div class="info-content">
                      <span class="info-label">Asignado a</span>
                      <span class="info-value unassigned">Sin asignar</span>
                    </div>
                  </div>
                }

                @if (issue()!.estimatedHours) {
                  <div class="info-item">
                    <mat-icon class="info-icon">schedule</mat-icon>
                    <div class="info-content">
                      <span class="info-label">Horas estimadas</span>
                      <span class="info-value">{{ issue()!.estimatedHours }}h</span>
                    </div>
                  </div>
                }

                <div class="info-item">
                  <mat-icon class="info-icon">event</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Creado</span>
                    <span class="info-value">{{ formatDate(issue()!.createdAt) }}</span>
                  </div>
                </div>

                <div class="info-item">
                  <mat-icon class="info-icon">update</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Última actualización</span>
                    <span class="info-value">{{ formatDate(issue()!.updatedAt) }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Description Card -->
          <mat-card class="description-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">description</mat-icon>
              <mat-card-title>Descripción</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (issue()!.description) {
                <p class="description-text">{{ issue()!.description }}</p>
              } @else {
                <p class="no-description">No se proporcionó descripción</p>
              }
            </mat-card-content>
          </mat-card>

          <!-- Time Tracking Section -->
          <mat-card class="time-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">access_time</mat-icon>
              <mat-card-title>Registro de tiempo</mat-card-title>
              <mat-card-subtitle>Tiempo registrado para esta incidencia</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (timeEntries().length === 0) {
                <div class="placeholder">
                  <mat-icon style="font-size: 48px; width: 48px; height: 48px; opacity: 0.5;">access_time</mat-icon>
                  <p>Aún no hay entradas de tiempo</p>
                  <p class="hint">Empieza a registrar tiempo para esta incidencia</p>
                </div>
              } @else {
                <div class="time-summary">
                  <div class="summary-item">
                    <mat-icon>schedule</mat-icon>
                    <div>
                      <span class="summary-value">{{ totalHours() }}h</span>
                      <span class="summary-label">Total registrado</span>
                    </div>
                  </div>
                  @if (issue()!.estimatedHours) {
                    <div class="summary-item">
                      <mat-icon>compare_arrows</mat-icon>
                      <div>
                        <span class="summary-value">{{ (totalHours() / issue()!.estimatedHours! * 100).toFixed(0) }}%</span>
                        <span class="summary-label">Progreso</span>
                      </div>
                    </div>
                  }
                </div>

                <table mat-table [dataSource]="timeEntries()" class="time-entries-table">
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Fecha</th>
                    <td mat-cell *matCellDef="let entry">{{ formatDateShort(entry.startTime) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>Usuario</th>
                    <td mat-cell *matCellDef="let entry">{{ entry.userName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>Descripción</th>
                    <td mat-cell *matCellDef="let entry">{{ entry.description || 'No description' }}</td>
                  </ng-container>

                  <ng-container matColumnDef="hours">
                    <th mat-header-cell *matHeaderCellDef>Horas</th>
                    <td mat-cell *matCellDef="let entry">
                      <span class="hours-badge">{{ (entry.durationMinutes ?? 0).toFixed(2) }}h</span>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="timeDisplayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: timeDisplayedColumns;"></tr>
                </table>
              }
            </mat-card-content>
          </mat-card>
        </div>
      } @else {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">error</mat-icon>
          <h2>Incidencia no encontrada</h2>
          <p>La incidencia que buscas no existe o no tienes acceso a ella.</p>
          <button mat-raised-button color="primary" (click)="goBack()">
            Volver
          </button>
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
      gap: 8px;
      flex: 1;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .type-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .chips-container {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    mat-chip {
      color: white;
      font-weight: 500;
    }

    .type-chip {
      background-color: var(--mat-sys-primary) !important;
    }

    .header-actions {
      display: flex;
      gap: 8px;
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
      margin: 0 0 24px 0;
      font-size: 16px;
      opacity: 0.8;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .info-card, .description-card, .time-card {
      height: fit-content;
    }

    .description-card {
      grid-column: 1 / -1;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .info-icon {
      color: var(--mat-sys-primary);
      margin-top: 2px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .info-label {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      font-weight: 500;
      text-transform: uppercase;
    }

    .info-value {
      font-size: 16px;
      color: var(--mat-sys-on-surface);
    }

    .unassigned {
      font-style: italic;
      opacity: 0.7;
    }

    .description-text {
      margin: 0;
      font-size: 16px;
      color: var(--mat-sys-on-surface);
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .no-description {
      margin: 0;
      font-size: 16px;
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
      opacity: 0.7;
    }

    .placeholder {
      text-align: center;
      padding: 40px 20px;
      color: var(--mat-sys-on-surface-variant);
    }

    .placeholder p {
      margin: 8px 0;
    }

    .hint {
      font-size: 14px;
      opacity: 0.7;
    }

    .time-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: var(--mat-sys-tertiary-container);
      border-radius: 8px;
    }

    .summary-item mat-icon {
      color: var(--mat-sys-primary);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .summary-value {
      display: block;
      font-size: 24px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      line-height: 1;
    }

    .summary-label {
      display: block;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    .time-entries-table {
      width: 100%;
    }

    .hours-badge {
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-left {
        width: 100%;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .description-card {
        grid-column: 1;
      }
    }
  `]
})
export class IssueDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private issueService = inject(IssueService);
  private timeEntryService = inject(TimeEntryService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public issue = signal<Issue | null>(null);
  public isLoading = signal<boolean>(false);
  public timeEntries = signal<TimeEntry[]>([]);

  public timeDisplayedColumns: string[] = ['date', 'user', 'description', 'hours'];

  private issueId: number = 0;

  public totalHours(): number {
    return this.timeEntries().reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
  }

  ngOnInit(): void {
    this.issueId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadIssue();
    this.loadTimeEntries();
  }

  loadIssue(): void {
    this.isLoading.set(true);
    this.issueService.getIssueById(this.issueId).subscribe({
      next: (issue) => {
        this.issue.set(issue);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading issue:', error);
        this.isLoading.set(false);
        this.issue.set(null);
      }
    });
  }

  loadTimeEntries(): void {
    this.timeEntryService.getTimeEntries(undefined, undefined, undefined, this.issueId).subscribe({
      next: (entries) => {
        this.timeEntries.set(entries);
      },
      error: (error) => {
        console.error('Error loading time entries:', error);
      }
    });
  }

  editIssue(): void {
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '700px',
      data: { issue: this.issue(), projectId: this.issue()!.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIssue();
      }
    });
  }

  confirmDelete(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Issue?',
        message: `Are you sure you want to delete "${this.issue()!.title}"? This action cannot be undone.`
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteIssue();
      }
    });
  }

  deleteIssue(): void {
    this.issueService.deleteIssue(this.issueId).subscribe({
      next: () => {
        this.toastService.showSuccess('Issue has been deleted.');
        this.router.navigate(['/issues']);
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/issues']);
  }
}

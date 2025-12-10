import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../interfaces';
import { ProjectStatus } from '../../../core/enums';
import { ProjectModalComponent } from '../project-modal/project-modal.component';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    EnumLabelPipe
  ],
  template: `
    <div class="container">
      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (project()) {
        <div class="header">
          <div class="header-left">
            <button mat-icon-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div>
              <h1>{{ project()!.name }}</h1>
              <mat-chip [style.background-color]="getStatusColor(project()!.status)">
                {{ project()!.status | enumLabel:'ProjectStatus' }}
              </mat-chip>
            </div>
          </div>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="editProject()">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-raised-button color="warn" (click)="confirmDelete()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </div>
        </div>

        <div class="content-grid">
          <!-- Project Information Card -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">info</mat-icon>
              <mat-card-title>Project Information</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-list">
                <div class="info-item">
                  <mat-icon class="info-icon">event</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Start Date</span>
                    <span class="info-value">{{ formatDate(project()!.startDate) }}</span>
                  </div>
                </div>

                @if (project()!.endDate) {
                  <div class="info-item">
                    <mat-icon class="info-icon">event</mat-icon>
                    <div class="info-content">
                      <span class="info-label">End Date</span>
                      <span class="info-value">{{ formatDate(project()!.endDate!) }}</span>
                    </div>
                  </div>
                } @else {
                  <div class="info-item">
                    <mat-icon class="info-icon">event</mat-icon>
                    <div class="info-content">
                      <span class="info-label">End Date</span>
                      <span class="info-value no-date">No end date set</span>
                    </div>
                  </div>
                }

                <div class="info-item">
                  <mat-icon class="info-icon">schedule</mat-icon>
                  <div class="info-content">
                    <span class="info-label">Created</span>
                    <span class="info-value">{{ formatDate(project()!.createdAt) }}</span>
                  </div>
                </div>

                @if (project()!.endDate && project()!.startDate) {
                  <div class="info-item">
                    <mat-icon class="info-icon">timer</mat-icon>
                    <div class="info-content">
                      <span class="info-label">Duration</span>
                      <span class="info-value">{{ calculateDuration(project()!.startDate, project()!.endDate!) }}</span>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Issues Section (Placeholder for Phase 4) -->
          <mat-card class="issues-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">assignment</mat-icon>
              <mat-card-title>Issues</mat-card-title>
              <mat-card-subtitle>Project tasks and issues</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="placeholder">
                <mat-icon style="font-size: 48px; width: 48px; height: 48px; opacity: 0.5;">assignment</mat-icon>
                <p>Issues will be available in Phase 4</p>
                <p class="hint">Coming soon: Track tasks, bugs, and user stories</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      } @else {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">error</mat-icon>
          <h2>Project not found</h2>
          <p>The project you're looking for doesn't exist or you don't have access to it.</p>
          <button mat-raised-button color="primary" (click)="goBack()">
            Go Back
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
    }

    .header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    mat-chip {
      color: white;
      font-weight: 500;
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

    .info-card, .issues-card {
      height: fit-content;
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

    .no-date {
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
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);

  public project = signal<Project | null>(null);
  public isLoading = signal<boolean>(false);

  private projectId: number = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
  }

  loadProject(): void {
    this.isLoading.set(true);
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.isLoading.set(false);
        this.project.set(null);
      }
    });
  }

  editProject(): void {
    const dialogRef = this.dialog.open(ProjectModalComponent, {
      width: '600px',
      data: { project: this.project(), companyId: this.project()!.companyId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProject();
      }
    });
  }

  confirmDelete(): void {
    Swal.fire({
      title: 'Delete Project?',
      text: `Are you sure you want to delete "${this.project()!.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteProject();
      }
    });
  }

  deleteProject(): void {
    this.projectService.deleteProject(this.projectId).subscribe({
      next: () => {
        Swal.fire({
          title: 'Deleted!',
          text: 'Project has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        console.error('Error deleting project:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete project. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  getStatusColor(status: ProjectStatus): string {
    const colors: Record<ProjectStatus, string> = {
      [ProjectStatus.Active]: '#4caf50',
      [ProjectStatus.OnHold]: '#ff9800',
      [ProjectStatus.Completed]: '#2196f3',
      [ProjectStatus.Cancelled]: '#757575'
    };
    return colors[status] || '#757575';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  calculateDuration(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 30) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    }
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}

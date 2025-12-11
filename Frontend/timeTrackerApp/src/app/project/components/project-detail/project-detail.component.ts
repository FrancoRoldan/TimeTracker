import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../interfaces';
import { ProjectStatus } from '../../../core/enums';
import { ProjectModalComponent } from '../project-modal/project-modal.component';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component.component';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    EnumLabelPipe
  ],
  template: `
    <div class="container">
      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (project()) {
        <!-- Header -->
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

        <!-- Tabs Navigation -->
        <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="tabs-nav">
          <a mat-tab-link
             [routerLink]="['overview']"
             routerLinkActive
             #rla1="routerLinkActive"
             [active]="rla1.isActive">
            <mat-icon>info</mat-icon>
            <span>Overview</span>
          </a>
          <a mat-tab-link
             [routerLink]="['issues']"
             routerLinkActive
             #rla2="routerLinkActive"
             [active]="rla2.isActive">
            <mat-icon>assignment</mat-icon>
            <span>Issues</span>
          </a>
          <a mat-tab-link
             [routerLink]="['board']"
             routerLinkActive
             #rla3="routerLinkActive"
             [active]="rla3.isActive">
            <mat-icon>view_kanban</mat-icon>
            <span>Board</span>
          </a>
        </nav>

        <!-- Tab Content -->
        <mat-tab-nav-panel #tabPanel>
          <router-outlet></router-outlet>
        </mat-tab-nav-panel>

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

    .tabs-nav {
      margin-bottom: 20px;
    }

    .tabs-nav a {
      display: flex;
      align-items: center;
      gap: 8px;
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
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project?',
        message: `Are you sure you want to delete "${this.project()!.name}"? This action cannot be undone.`
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteProject();
      }
    });
  }

  deleteProject(): void {
    this.projectService.deleteProject(this.projectId).subscribe({
      next: () => {
        this.toastService.showSuccess('Project has been deleted.');
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        console.error('Error deleting project:', error);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to delete project. Please try again.')
          } as ErrorDialogData
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

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}

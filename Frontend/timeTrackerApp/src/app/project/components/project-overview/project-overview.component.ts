import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../interfaces';
import { MyIssuesComponent } from "../../../issue/components/my-issues/my-issues.component";
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MyIssuesComponent,
    MatDivider
],
  template: `
    <div class="overview-container">
      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (project()) {
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
              <div class="mb-4"></div>
              <mat-divider class="mt-2"></mat-divider>
              <app-my-issues></app-my-issues>

            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .overview-container {
      padding: 20px 0;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .info-card {
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

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProjectOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  public project = signal<Project | null>(null);
  public isLoading = signal<boolean>(false);

  private projectId: number = 0;

  ngOnInit(): void {
    // Get projectId from parent route
    this.projectId = Number(this.route.parent?.snapshot.paramMap.get('id'));
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    // Use UTC to avoid timezone offset issues when displaying dates
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
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
}

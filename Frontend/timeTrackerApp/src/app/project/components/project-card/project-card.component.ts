import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Project } from '../../interfaces';
import { ProjectStatus } from '../../../core/enums';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';

@Component({
  selector: 'app-project-card',
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
    <mat-card class="project-card">
      <mat-card-header>
        <mat-icon mat-card-avatar color="primary">folder</mat-icon>
        <mat-card-title>{{ project().name }}</mat-card-title>
        <mat-card-subtitle>
          <mat-chip [style.background-color]="getStatusColor(project().status)">
            {{ project().status | enumLabel:'ProjectStatus' }}
          </mat-chip>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="project-info">
            <div class="info-row">
            <mat-icon class="info-icon">event</mat-icon>
            <span class="info-label">Inicio:</span>
            <span>{{ formatDate(project().startDate) }}</span>
          </div>

          @if (project().endDate) {
            <div class="info-row">
              <mat-icon class="info-icon">event</mat-icon>
              <span class="info-label">Fin:</span>
              <span>{{ formatDate(project().endDate!) }}</span>
            </div>
          } @else {
            <div class="info-row">
              <mat-icon class="info-icon">event</mat-icon>
              <span class="info-label">Fin:</span>
              <span class="no-date">Sin fecha de fin</span>
            </div>
          }

            <div class="info-row">
            <mat-icon class="info-icon">schedule</mat-icon>
            <span class="info-label">Creado:</span>
            <span>{{ formatDate(project().createdAt) }}</span>
          </div>
        </div>
      </mat-card-content>

      <mat-card-actions>
        <button mat-button color="primary" (click)="onView()">
          <mat-icon>visibility</mat-icon>
          Ver
        </button>
        <button mat-button (click)="onEdit()">
          <mat-icon>edit</mat-icon>
          Editar
        </button>
        <button mat-button color="warn" (click)="onDelete()">
          <mat-icon>delete</mat-icon>
          Eliminar
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    :host {
      display: block;
    }

    .project-card {
      transition: transform 0.2s, box-shadow 0.2s;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .project-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-content {
      flex: 1;
    }

    mat-chip {
      color: white;
      font-weight: 500;
      font-size: 11px;
      min-height: 24px;
      padding: 0 8px;
    }

    .project-info {
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
      min-width: 50px;
    }

    .no-date {
      font-style: italic;
      opacity: 0.7;
    }

    mat-card-actions {
      padding: 8px 16px 16px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  `]
})
export class ProjectCardComponent {
  project = input.required<Project>();

  viewProject = output<Project>();
  editProject = output<Project>();
  deleteProject = output<Project>();

  onView(): void {
    this.viewProject.emit(this.project());
  }

  onEdit(): void {
    this.editProject.emit(this.project());
  }

  onDelete(): void {
    this.deleteProject.emit(this.project());
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
    // Use UTC to avoid timezone offset issues when displaying dates
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }
}

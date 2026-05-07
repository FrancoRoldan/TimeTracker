import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, interval, Subscription, of } from 'rxjs';
import { catchError, startWith } from 'rxjs/operators';

import { AuthService } from '../auth/services/auth.service';
import { CompanyService } from '../company/services/company.service';
import { TimeEntryService } from '../time-entry/services/time-entry.service';
import { IssueService } from '../issue/services/issue.service';
import { ProjectService } from '../project/services/project.service';
import { TimeEntry } from '../time-entry/interfaces';
import { Issue } from '../issue/interfaces';
import { Project } from '../project/interfaces';
import { IssueStatus, IssuePriority, ProjectStatus } from '../core/enums';
import { User } from '../auth/interfaces/user.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div>
          <h1>Inicio</h1>
          <p class="date-subtitle">{{ todayDateFormatted }}</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else {

        <!-- Active Timer Card -->
        @if (activeTimer()) {
          <mat-card class="timer-card">
            <mat-card-content>
              <div class="timer-row">
                <mat-icon class="timer-icon">timer</mat-icon>
                <div class="timer-info">
                  <span class="timer-label">Timer activo</span>
                  <span class="timer-elapsed">{{ elapsedTime() }}</span>
                  @if (activeTimer()?.description) {
                    <span class="timer-desc">{{ activeTimer()!.description }}</span>
                  }
                </div>
                <button mat-flat-button class="stop-btn" (click)="stopTimer()">
                  <mat-icon>stop</mat-icon>
                  Detener
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Today Summary Card -->
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-header">
              <div class="summary-title">
                <mat-icon class="summary-icon">schedule</mat-icon>
                <span>Horas hoy</span>
              </div>
              <span class="summary-total">{{ todayFormatted }}</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="todayProgressPercent"></mat-progress-bar>
            <p class="summary-pct">{{ todayProgressPercent }}% de la jornada (8h)</p>
          </mat-card-content>
        </mat-card>

        <!-- Active Issues -->
        @if (activeIssues().length > 0) {
          <div class="section-header">
            <span class="section-title">Mis issues activos</span>
            <button mat-button routerLink="/issues">Ver todos</button>
          </div>
          <div class="issues-list">
            @for (issue of activeIssues(); track issue.id) {
              <mat-card class="issue-card">
                <mat-card-content>
                  <div class="issue-row">
                    <div class="priority-bar" [style.background-color]="getPriorityColor(issue.priority)"></div>
                    <div class="issue-info">
                      <span class="issue-title">{{ issue.title }}</span>
                      <span class="issue-project">{{ issue.projectName }}</span>
                    </div>
                    <span class="status-badge"
                      [style.color]="getStatusColor(issue.status)"
                      [style.background-color]="getStatusBgColor(issue.status)">
                      {{ getStatusLabel(issue.status) }}
                    </span>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }

        <!-- Active Projects -->
        @if (activeProjects().length > 0) {
          <div class="section-header">
            <span class="section-title">Proyectos activos</span>
            <button mat-button routerLink="/projects">Ver todos</button>
          </div>
          <div class="projects-grid">
            @for (project of activeProjects(); track project.id) {
              <mat-card class="project-card">
                <mat-card-content>
                  <div class="project-row">
                    <mat-icon class="project-icon">folder_outlined</mat-icon>
                    <span class="project-name">{{ project.name }}</span>
                  </div>
                  <span class="project-status" [style.color]="getProjectStatusColor(project.status)">
                    {{ getProjectStatusLabel(project.status) }}
                  </span>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }

        <!-- Today's Activity -->
        @if (recentEntries().length > 0) {
          <div class="section-header">
            <span class="section-title">Actividad de hoy</span>
            <button mat-button routerLink="/time">Ver todos</button>
          </div>
          <div class="entries-list">
            @for (entry of recentEntries(); track entry.id) {
              <div class="entry-row">
                <mat-icon class="entry-icon">access_time_outlined</mat-icon>
                <div class="entry-info">
                  <span class="entry-desc">{{ entry.description || 'Sin descripción' }}</span>
                  <span class="entry-time">{{ formatTime(entry.startTime) }}</span>
                </div>
                <span class="entry-duration">{{ formatDuration(entry.durationMinutes) }}</span>
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @if (isEmpty) {
          <div class="empty-state">
            <mat-icon class="empty-icon">dashboard_outlined</mat-icon>
            <h3>Todo listo</h3>
            <p>Seleccioná una empresa y comenzá a registrar tiempo</p>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 20px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .date-subtitle {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      text-transform: capitalize;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    /* Timer Card */
    .timer-card {
      background-color: var(--mat-sys-primary-container);
      margin-bottom: 16px;
    }

    .timer-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .timer-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--mat-sys-on-primary-container);
      flex-shrink: 0;
    }

    .timer-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .timer-label {
      font-size: 12px;
      color: var(--mat-sys-on-primary-container);
      opacity: 0.8;
    }

    .timer-elapsed {
      font-size: 28px;
      font-weight: 700;
      font-family: monospace;
      color: var(--mat-sys-on-primary-container);
      line-height: 1.2;
    }

    .timer-desc {
      font-size: 12px;
      color: var(--mat-sys-on-primary-container);
      opacity: 0.8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stop-btn {
      background-color: var(--mat-sys-on-primary-container);
      color: var(--mat-sys-primary-container);
      flex-shrink: 0;
    }

    /* Summary Card */
    .summary-card {
      margin-bottom: 16px;
    }

    .summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .summary-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .summary-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-primary);
    }

    .summary-total {
      font-size: 22px;
      font-weight: 700;
      color: var(--mat-sys-primary);
    }

    .summary-pct {
      margin: 6px 0 0 0;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    /* Section Header */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      margin-top: 4px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    /* Issues */
    .issues-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .issue-card {
      margin: 0;
    }

    .issue-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .priority-bar {
      width: 3px;
      height: 36px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .issue-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .issue-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .issue-project {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .status-badge {
      font-size: 11px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 6px;
      flex-shrink: 0;
    }

    /* Projects Grid */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }

    .project-card {
      margin: 0;
    }

    .project-card mat-card-content {
      padding: 12px 12px 8px !important;
    }

    .project-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .project-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--mat-sys-primary);
      flex-shrink: 0;
    }

    .project-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .project-status {
      font-size: 11px;
      font-weight: 500;
    }

    /* Time Entries */
    .entries-list {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
    }

    .entry-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .entry-row:last-child {
      border-bottom: none;
    }

    .entry-icon {
      color: var(--mat-sys-on-surface-variant);
      flex-shrink: 0;
    }

    .entry-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .entry-desc {
      font-size: 14px;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .entry-time {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .entry-duration {
      font-size: 14px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      flex-shrink: 0;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    @media (max-width: 768px) {
      .projects-grid {
        grid-template-columns: 1fr;
      }

      .timer-elapsed {
        font-size: 22px;
      }

      .header h1 {
        font-size: 22px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private companyService = inject(CompanyService);
  private timeEntryService = inject(TimeEntryService);
  private issueService = inject(IssueService);
  private projectService = inject(ProjectService);

  isLoading = signal(true);
  activeTimer = signal<TimeEntry | null>(null);
  todayMinutes = signal(0);
  activeIssues = signal<Issue[]>([]);
  activeProjects = signal<Project[]>([]);
  recentEntries = signal<TimeEntry[]>([]);
  elapsedTime = signal('00:00:00');

  private subs = new Subscription();
  private timerSub: Subscription | null = null;

  get todayDateFormatted(): string {
    return new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  get todayFormatted(): string {
    const mins = this.todayMinutes();
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  get todayProgressPercent(): number {
    return Math.round(Math.min(this.todayMinutes() / 480, 1) * 100);
  }

  get isEmpty(): boolean {
    return this.activeProjects().length === 0 && this.activeIssues().length === 0 && this.recentEntries().length === 0;
  }

  ngOnInit(): void {
    this.subs.add(
      this.companyService.selectedCompany$.subscribe(company => {
        this.loadDashboard(company?.id);
      })
    );
  }

  private loadDashboard(companyId?: number): void {
    this.isLoading.set(true);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    forkJoin({
      activeTimer: this.timeEntryService.getActiveTimer(),
      todayEntries: this.timeEntryService.getTimeEntries(
        todayStart.toISOString(),
        now.toISOString()
      ).pipe(catchError(() => of([]))),
      issues: this.issueService.getMyIssues(companyId).pipe(catchError(() => of([]))),
      projects: this.projectService.getProjects(companyId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ activeTimer, todayEntries, issues, projects }) => {
        this.activeTimer.set(activeTimer);

        const todayMins = todayEntries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
        this.todayMinutes.set(todayMins);

        this.activeIssues.set(issues.filter(i => i.status !== IssueStatus.Done).slice(0, 5));
        this.activeProjects.set(projects.filter(p => p.status === ProjectStatus.Active).slice(0, 6));
        this.recentEntries.set(todayEntries.filter(e => e.endTime !== null).slice(0, 5));

        this.isLoading.set(false);

        if (activeTimer) {
          this.startElapsedTimer(activeTimer);
        } else {
          this.stopElapsedTimer();
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private startElapsedTimer(entry: TimeEntry): void {
    this.stopElapsedTimer();
    const start = new Date(entry.startTime).getTime();
    this.timerSub = interval(1000).pipe(startWith(0)).subscribe(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      this.elapsedTime.set(`${h}:${m}:${s}`);
    });
  }

  private stopElapsedTimer(): void {
    this.timerSub?.unsubscribe();
    this.timerSub = null;
  }

  stopTimer(): void {
    this.timeEntryService.stopTimer().subscribe(() => {
      this.activeTimer.set(null);
      this.stopElapsedTimer();
      this.loadDashboard(this.companyService.getSelectedCompany()?.id);
    });
  }

  getPriorityColor(priority: IssuePriority): string {
    switch (priority) {
      case IssuePriority.Low: return '#4caf50';
      case IssuePriority.Medium: return '#ff9800';
      case IssuePriority.High: return '#f44336';
      case IssuePriority.Critical: return '#9c27b0';
      default: return '#757575';
    }
  }

  getStatusColor(status: IssueStatus): string {
    switch (status) {
      case IssueStatus.ToDo: return '#757575';
      case IssueStatus.InProgress: return '#2196f3';
      case IssueStatus.Testing: return '#ff9800';
      case IssueStatus.Done: return '#4caf50';
      default: return '#757575';
    }
  }

  getStatusBgColor(status: IssueStatus): string {
    return this.getStatusColor(status) + '26';
  }

  getStatusLabel(status: IssueStatus): string {
    switch (status) {
      case IssueStatus.ToDo: return 'Por hacer';
      case IssueStatus.InProgress: return 'En progreso';
      case IssueStatus.Testing: return 'En prueba';
      case IssueStatus.Done: return 'Hecho';
      default: return '';
    }
  }

  getProjectStatusColor(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.Active: return '#4caf50';
      case ProjectStatus.OnHold: return '#ff9800';
      case ProjectStatus.Completed: return '#2196f3';
      case ProjectStatus.Cancelled: return '#f44336';
      default: return '#757575';
    }
  }

  getProjectStatusLabel(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.Active: return 'Activo';
      case ProjectStatus.OnHold: return 'En espera';
      case ProjectStatus.Completed: return 'Completado';
      case ProjectStatus.Cancelled: return 'Cancelado';
      default: return '';
    }
  }

  formatDuration(minutes: number | null): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.stopElapsedTimer();
  }
}

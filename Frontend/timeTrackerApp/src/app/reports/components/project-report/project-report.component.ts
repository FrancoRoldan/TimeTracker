import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ReportsService } from '../../services/reports.service';
import { ProjectService } from '../../../project/services/project.service';
import { CompanyService } from '../../../company/services/company.service';
import { ProjectReport } from '../../interfaces';
import { Project } from '../../../project/interfaces/project.interface';
import { LineChartComponent } from '../../shared/line-chart/line-chart.component';
import { BarChartComponent } from '../../shared/bar-chart/bar-chart.component';
import { PieChartComponent } from '../../shared/pie-chart/pie-chart.component';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';

@Component({
  selector: 'app-project-report',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    LineChartComponent,
    BarChartComponent,
    PieChartComponent
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <mat-icon class="header-icon" color="primary">folder_open</mat-icon>
          <div>
            <h1>Informe de proyecto</h1>
            @if (report()) {
              <p class="project-name">{{ report()!.projectName }}</p>
              <p class="subtitle">{{ formatDateRange() }}</p>
            } @else {
              <p class="subtitle">Ver el registro de tiempo por proyecto</p>
            }
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="exportToCSV()" [disabled]="!report()">
          <mat-icon>download</mat-icon>
          Exportar CSV
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <mat-card>
          <mat-card-content>
            <div class="filters">
              <mat-form-field appearance="outline" class="project-select">
                <mat-label>Seleccionar proyecto</mat-label>
                <mat-select [(value)]="selectedProjectId" (selectionChange)="onProjectChange()">
                  @for (project of projects(); track project.id) {
                    <mat-option [value]="project.id">
                      {{ project.name }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha de inicio</mat-label>
                <input
                  matInput
                  [matDatepicker]="startPicker"
                  [value]="startDate()"
                  (dateChange)="onStartDateChange($event.value)">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha de fin</mat-label>
                <input
                  matInput
                  [matDatepicker]="endPicker"
                  [value]="endDate()"
                  (dateChange)="onEndDateChange($event.value)">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>

              <button mat-raised-button (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>

              <button mat-raised-button (click)="loadReport()" [disabled]="!selectedProjectId">
                <mat-icon>refresh</mat-icon>
                Actualizar
              </button>
            </div>

            <!-- Quick Date Range Buttons -->
            <div class="quick-ranges">
              <button mat-button (click)="setDateRange(7)">Últimos 7 días</button>
              <button mat-button (click)="setDateRange(30)">Últimos 30 días</button>
              <button mat-button (click)="setThisMonth()">Este mes</button>
              <button mat-button (click)="setLastMonth()">Mes anterior</button>
              <button mat-button (click)="setThisYear()">Este año</button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (!report()) {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">folder_open</mat-icon>
          <h2>No hay datos disponibles</h2>
          <p>Selecciona un proyecto y un rango de fechas para ver el informe</p>
        </div>
      } @else {
        <!-- Summary Cards -->
        <div class="summary-section">
          <div class="summary-card total-hours">
            <mat-card>
              <mat-card-content>
                <div class="summary-content">
                  <mat-icon class="summary-icon">access_time</mat-icon>
                  <div class="summary-info">
                    <span class="summary-value">{{ formatTotalTime() }}</span>
                    <span class="summary-label">Tiempo total</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <div class="summary-card">
            <mat-card>
              <mat-card-content>
                <div class="summary-content">
                  <mat-icon class="summary-icon">people</mat-icon>
                  <div class="summary-info">
                    <span class="summary-value">{{ report()!.userBreakdown.length }}</span>
                    <span class="summary-label">Colaboradores</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <div class="summary-card">
            <mat-card>
              <mat-card-content>
                <div class="summary-content">
                  <mat-icon class="summary-icon">assignment</mat-icon>
                  <div class="summary-info">
                    <span class="summary-value">{{ report()!.issueBreakdown.length }}</span>
                    <span class="summary-label">Incidencias</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <!-- Daily Breakdown -->
          <div class="chart-full-width">
            <app-line-chart
              [data]="dailyChartData()"
              [labels]="dailyChartLabels()"
              [title]="'Tendencia diaria de horas'"
              [label]="'Horas'"
              [isLoading]="isLoading()">
            </app-line-chart>
          </div>

          <!-- User Breakdown -->
          <div class="chart-container">
            <app-pie-chart
              [data]="userChartData()"
              [labels]="userChartLabels()"
              [title]="'Horas por usuario'"
              [isLoading]="isLoading()">
            </app-pie-chart>
          </div>

          <!-- Issue Breakdown as Bar Chart -->
          <div class="chart-container">
            <app-bar-chart
              [data]="issueChartData()"
              [labels]="issueChartLabels()"
              [title]="'Horas por incidencia (Top 10)'"
              [label]="'Horas'"
              [isLoading]="isLoading()">
            </app-bar-chart>
          </div>
        </div>

        <!-- Issue Breakdown Table -->
        <mat-card class="table-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">list</mat-icon>
            <mat-card-title>Desglose de incidencias</mat-card-title>
            <mat-card-subtitle>Desglose detallado del tiempo por incidencia</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="sortedIssues()" class="issues-table">
                <!-- Issue Column -->
                <ng-container matColumnDef="issue">
                  <th mat-header-cell *matHeaderCellDef>Incidencia</th>
                  <td mat-cell *matCellDef="let item">{{ item.issueTitle }}</td>
                </ng-container>

                <!-- Hours Column -->
                <ng-container matColumnDef="hours">
                  <th mat-header-cell *matHeaderCellDef>Horas</th>
                  <td mat-cell *matCellDef="let item">
                    <span class="hours-badge">{{ (item.totalHours ?? 0).toFixed(2) }}h</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
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

    .project-name {
      margin: 4px 0 0 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .subtitle {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filters mat-form-field {
      flex: 1;
      min-width: 180px;
    }

    .project-select {
      min-width: 250px;
    }

    .quick-ranges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 8px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      margin-top: 12px;
    }

    .quick-ranges button {
      font-size: 13px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 60px;
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

    .summary-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .summary-card mat-card {
      background-color: var(--mat-sys-surface);
      height: 100%;
    }

    .summary-card.total-hours mat-card {
      background-color: var(--mat-sys-primary-container);
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-primary);
    }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      line-height: 1;
    }

    .summary-label {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .chart-full-width {
      grid-column: 1 / -1;
      min-height: 300px;
    }

    .chart-container {
      min-height: 300px;
    }

    .table-card {
      background-color: var(--mat-sys-surface);
    }

    .table-container {
      overflow-x: auto;
    }

    .issues-table {
      width: 100%;
    }

    .hours-badge {
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
      }

      .filters {
        flex-direction: column;
      }

      .filters mat-form-field,
      .filters button {
        width: 100%;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .chart-full-width {
        grid-column: 1;
      }
    }
  `]
})
export class ProjectReportComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private projectService = inject(ProjectService);
  private companyService = inject(CompanyService);
  private dialog = inject(MatDialog);

  public report = signal<ProjectReport | null>(null);
  public projects = signal<Project[]>([]);
  public isLoading = signal<boolean>(false);
  public startDate = signal<Date | null>(null);
  public endDate = signal<Date | null>(null);
  public selectedProjectId: number | null = null;

  public displayedColumns: string[] = ['issue', 'hours'];

  // Computed values for charts
  public dailyChartData = computed(() => {
    return this.report()?.dailyBreakdown.map(d => d.totalHours) || [];
  });

  public dailyChartLabels = computed(() => {
    return this.report()?.dailyBreakdown.map(d => this.formatDate(d.date)) || [];
  });

  public userChartData = computed(() => {
    return this.report()?.userBreakdown.map(u => u.totalHours) || [];
  });

  public userChartLabels = computed(() => {
    return this.report()?.userBreakdown.map(u => u.userName) || [];
  });

  public issueChartData = computed(() => {
    // Show only top 10 issues
    const issues = this.report()?.issueBreakdown.slice(0, 10) || [];
    return issues.map(i => i.totalHours);
  });

  public issueChartLabels = computed(() => {
    const issues = this.report()?.issueBreakdown.slice(0, 10) || [];
    return issues.map(i => i.issueTitle.length > 30
      ? i.issueTitle.substring(0, 30) + '...'
      : i.issueTitle);
  });

  public sortedIssues = computed(() => {
    const issues = this.report()?.issueBreakdown || [];
    return [...issues].sort((a, b) => b.totalHours - a.totalHours);
  });

  public sortedUsers = computed(() => {
    const users = this.report()?.userBreakdown || [];
    return [...users].sort((a, b) => b.totalHours - a.totalHours);
  });

  ngOnInit(): void {
    // Set default date range: last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.startDate.set(start);
    this.endDate.set(end);

    // Load available projects
    this.loadProjects();
  }

  loadProjects(): void {
    this.companyService.selectedCompany$.subscribe(company => {
      if (company?.id) {
        this.projectService.getProjects(company.id).subscribe({
          next: (projects) => {
            this.projects.set(projects);
            // Auto-select first project if available
            if (projects.length > 0 && !this.selectedProjectId) {
              this.selectedProjectId = projects[0].id;
              this.loadReport();
            }
          },
          error: (error) => {
            console.error('Error loading projects:', error);
            this.dialog.open(ErrorDialogComponent, {
              data: {
                title: 'Error!',
                message: extractErrorMessage(error, 'Failed to load projects. Please select a company first.')
              } as ErrorDialogData
            });
          }
        });
      }
    });
  }

  loadReport(): void {
    if (!this.selectedProjectId) return;

    this.isLoading.set(true);
    const startDateStr = this.startDate() ? this.startDate()!.toISOString() : undefined;
    const endDateStr = this.endDate() ? this.endDate()!.toISOString() : undefined;

    this.reportsService.getProjectReport(this.selectedProjectId, startDateStr, endDateStr).subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading project report:', error);
        this.isLoading.set(false);

        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to load project report. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }

  onProjectChange(): void {
    if (this.selectedProjectId) {
      this.loadReport();
    }
  }

  onStartDateChange(date: Date | null): void {
    this.startDate.set(date);
    if (this.startDate() && this.endDate() && this.selectedProjectId) {
      this.loadReport();
    }
  }

  onEndDateChange(date: Date | null): void {
    this.endDate.set(date);
    if (this.startDate() && this.endDate() && this.selectedProjectId) {
      this.loadReport();
    }
  }

  clearFilters(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.startDate.set(start);
    this.endDate.set(end);

    if (this.selectedProjectId) {
      this.loadReport();
    }
  }

  setDateRange(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    this.startDate.set(start);
    this.endDate.set(end);
    if (this.selectedProjectId) {
      this.loadReport();
    }
  }

  setThisMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();

    this.startDate.set(start);
    this.endDate.set(end);
    if (this.selectedProjectId) {
      this.loadReport();
    }
  }

  setLastMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    this.startDate.set(start);
    this.endDate.set(end);
    if (this.selectedProjectId) {
      this.loadReport();
    }
  }

  setThisYear(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date();

    this.startDate.set(start);
    this.endDate.set(end);
    if (this.selectedProjectId) {
      this.loadReport();
    }
  }

  exportToCSV(): void {
    if (!this.report()) return;

    const report = this.report()!;
    let csv = 'Issue,Hours\n';

    this.sortedIssues().forEach(item => {
      csv += `"${item.issueTitle}",${(item.totalHours ?? 0).toFixed(2)}\n`;
    });

    csv += `\nUser,Hours\n`;
    this.sortedUsers().forEach(user => {
      csv += `"${user.userName}",${(user.totalHours ?? 0).toFixed(2)}\n`;
    });

    csv += `\nTotal Hours:,${(report.totalHours ?? 0).toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `project_report_${report.projectName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'Success!',
        message: 'Report exported successfully'
      } as ErrorDialogData
    });
  }

  formatDateRange(): string {
    const report = this.report();
    if (!report) return '';

    const startDate = new Date(report.dateFrom);
    const endDate = new Date(report.dateTo);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };

    return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
  }

  formatTotalTime(): string {
    const report = this.report();
    if (!report) return '0h 0m';

    const hours = Math.floor((report.totalMinutes ?? 0) / 60);
    const minutes = (report.totalMinutes ?? 0) % 60;

    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

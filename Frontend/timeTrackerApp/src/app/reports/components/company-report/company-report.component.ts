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
import { CompanyService } from '../../../company/services/company.service';
import { CompanyReport } from '../../interfaces';
import { Company } from '../../../company/interfaces/company.interface';
import { LineChartComponent } from '../../shared/line-chart/line-chart.component';
import { BarChartComponent } from '../../shared/bar-chart/bar-chart.component';
import { DoughnutChartComponent } from '../../shared/doughnut-chart/doughnut-chart.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-report',
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
    DoughnutChartComponent
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <mat-icon class="header-icon" color="primary">business</mat-icon>
          <div>
            @if (report()) {
              <h1>{{ report()!.companyName }}</h1>
              <p class="subtitle">{{ formatDateRange() }}</p>
            } @else {
              <h1>Informe de la empresa</h1>
              <p class="subtitle">Análisis del registro de tiempo a nivel de empresa</p>
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
              <mat-form-field appearance="outline" class="company-select">
                <mat-label>Seleccionar empresa</mat-label>
                <mat-select [(value)]="selectedCompanyId" (selectionChange)="onCompanyChange()">
                  @for (company of companies(); track company.id) {
                    <mat-option [value]="company.id">
                      {{ company.name }}
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

              <button mat-raised-button (click)="loadReport()" [disabled]="!selectedCompanyId">
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
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">business</mat-icon>
          <h2>No hay datos disponibles</h2>
          <p>Selecciona una empresa y un rango de fechas para ver el informe</p>
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
                    <span class="summary-label">Usuarios activos</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <div class="summary-card">
            <mat-card>
              <mat-card-content>
                <div class="summary-content">
                  <mat-icon class="summary-icon">folder</mat-icon>
                  <div class="summary-info">
                    <span class="summary-value">{{ report()!.projectBreakdown.length }}</span>
                    <span class="summary-label">Proyectos activos</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <div class="summary-card">
            <mat-card>
              <mat-card-content>
                <div class="summary-content">
                  <mat-icon class="summary-icon">trending_up</mat-icon>
                  <div class="summary-info">
                    <span class="summary-value">{{ avgHoursPerDay() }}h</span>
                    <span class="summary-label">Promedio por día</span>
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
            <app-doughnut-chart
              [data]="userChartData()"
              [labels]="userChartLabels()"
              [title]="'Horas por usuario'"
              [isLoading]="isLoading()">
            </app-doughnut-chart>
          </div>

          <!-- Project Breakdown -->
          <div class="chart-container">
            <app-bar-chart
              [data]="projectChartData()"
              [labels]="projectChartLabels()"
              [title]="'Horas por proyecto'"
              [label]="'Horas'"
              [isLoading]="isLoading()">
            </app-bar-chart>
          </div>
        </div>

        <!-- Data Tables -->
        <div class="tables-section">
          <!-- User Breakdown Table -->
          <mat-card class="table-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">people</mat-icon>
              <mat-card-title>Desglose por usuario</mat-card-title>
              <mat-card-subtitle>Tiempo registrado por miembro del equipo</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="table-container">
                <table mat-table [dataSource]="sortedUsers()" class="data-table">
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>Usuario</th>
                    <td mat-cell *matCellDef="let item">{{ item.userName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="hours">
                    <th mat-header-cell *matHeaderCellDef>Horas</th>
                    <td mat-cell *matCellDef="let item">
                      <span class="hours-badge">{{ (item.totalHours ?? 0).toFixed(2) }}h</span>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Project Breakdown Table -->
          <mat-card class="table-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">folder</mat-icon>
              <mat-card-title>Desglose por proyecto</mat-card-title>
              <mat-card-subtitle>Tiempo registrado por proyecto</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="table-container">
                <table mat-table [dataSource]="sortedProjects()" class="data-table">
                  <ng-container matColumnDef="project">
                    <th mat-header-cell *matHeaderCellDef>Proyecto</th>
                    <td mat-cell *matCellDef="let item">{{ item.projectName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="hours">
                    <th mat-header-cell *matHeaderCellDef>Hours</th>
                    <td mat-cell *matCellDef="let item">
                      <span class="hours-badge">{{ (item.totalHours ?? 0).toFixed(2) }}h</span>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="projectColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: projectColumns;"></tr>
                </table>
              </div>
            </mat-card-content>
          </mat-card>
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

    .company-select {
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
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

    .tables-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .table-card {
      background-color: var(--mat-sys-surface);
    }

    .table-container {
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }

    .data-table {
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

      .charts-section,
      .tables-section {
        grid-template-columns: 1fr;
      }

      .chart-full-width {
        grid-column: 1;
      }
    }
  `]
})
export class CompanyReportComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private companyService = inject(CompanyService);

  public report = signal<CompanyReport | null>(null);
  public companies = signal<Company[]>([]);
  public isLoading = signal<boolean>(false);
  public startDate = signal<Date | null>(null);
  public endDate = signal<Date | null>(null);
  public selectedCompanyId: number | null = null;

  public userColumns: string[] = ['user', 'hours'];
  public projectColumns: string[] = ['project', 'hours'];

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

  public projectChartData = computed(() => {
    return this.report()?.projectBreakdown.map(p => p.totalHours) || [];
  });

  public projectChartLabels = computed(() => {
    return this.report()?.projectBreakdown.map(p => p.projectName.length > 20
      ? p.projectName.substring(0, 20) + '...'
      : p.projectName) || [];
  });

  public avgHoursPerDay = computed(() => {
    const report = this.report();
    if (!report || report.dailyBreakdown.length === 0) return '0.00';

    const total = report.dailyBreakdown.reduce((sum, d) => sum + d.totalHours, 0);
    return (total / report.dailyBreakdown.length).toFixed(2);
  });

  public sortedUsers = computed(() => {
    const users = this.report()?.userBreakdown || [];
    return [...users].sort((a, b) => b.totalHours - a.totalHours);
  });

  public sortedProjects = computed(() => {
    const projects = this.report()?.projectBreakdown || [];
    return [...projects].sort((a, b) => b.totalHours - a.totalHours);
  });

  ngOnInit(): void {
    // Set default date range: last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.startDate.set(start);
    this.endDate.set(end);

    // Load available companies
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        // Auto-select first company if available
        if (companies.length > 0 && !this.selectedCompanyId) {
          this.selectedCompanyId = companies[0].id;
          this.loadReport();
        }
      },
      error: (error) => {
        console.error('Error loading companies:', error);
      }
    });
  }

  loadReport(): void {
    if (!this.selectedCompanyId) return;

    this.isLoading.set(true);
    const startDateStr = this.startDate() ? this.startDate()!.toISOString() : undefined;
    const endDateStr = this.endDate() ? this.endDate()!.toISOString() : undefined;

    this.reportsService.getCompanyReport(this.selectedCompanyId, startDateStr, endDateStr).subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading company report:', error);
        this.isLoading.set(false);

        Swal.fire({
          title: 'Error!',
          text: 'Failed to load company report. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.loadReport();
    }
  }

  onStartDateChange(date: Date | null): void {
    this.startDate.set(date);
    if (this.startDate() && this.endDate() && this.selectedCompanyId) {
      this.loadReport();
    }
  }

  onEndDateChange(date: Date | null): void {
    this.endDate.set(date);
    if (this.startDate() && this.endDate() && this.selectedCompanyId) {
      this.loadReport();
    }
  }

  clearFilters(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.startDate.set(start);
    this.endDate.set(end);

    if (this.selectedCompanyId) {
      this.loadReport();
    }
  }

  setDateRange(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    this.startDate.set(start);
    this.endDate.set(end);
    if (this.selectedCompanyId) {
      this.loadReport();
    }
  }

  setThisMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();

    this.startDate.set(start);
    this.endDate.set(end);
    if (this.selectedCompanyId) {
      this.loadReport();
    }
  }

  setLastMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    this.startDate.set(start);
    this.endDate.set(end);
    if (this.selectedCompanyId) {
      this.loadReport();
    }
  }

  setThisYear(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date();

    this.startDate.set(start);
    this.endDate.set(end);
    if (this.selectedCompanyId) {
      this.loadReport();
    }
  }

  exportToCSV(): void {
    if (!this.report()) return;

    const report = this.report()!;
    let csv = 'Company Report\n\n';
    csv += `Company:,${report.companyName}\n`;
    csv += `Period:,${this.formatDate(report.dateFrom)} - ${this.formatDate(report.dateTo)}\n`;
    csv += `Total Hours:,${(report.totalHours ?? 0).toFixed(2)}\n\n`;

    csv += 'User,Hours\n';
    this.sortedUsers().forEach(user => {
      csv += `"${user.userName}",${(user.totalHours ?? 0).toFixed(2)}\n`;
    });

    csv += `\nProject,Hours\n`;
    this.sortedProjects().forEach(project => {
      csv += `"${project.projectName}",${(project.totalHours ?? 0).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `company_report_${report.companyName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      title: 'Success!',
      text: 'Report exported successfully',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
}

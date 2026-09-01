import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimeEntryService } from '../../services/time-entry.service';
import { TimeEntry } from '../../interfaces';
import { TimeEntryModalComponent } from '../time-entry-modal/time-entry-modal.component';
import { TimeTrackerComponent } from "../time-tracker/time-tracker.component";
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component.component';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';
import { SpanishPaginatorIntl } from '../../../shared/services/spanish-paginator-intl.service';

@Component({
  selector: 'app-time-entry-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatChipsModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <mat-icon class="header-icon" color="primary">access_time</mat-icon>
          <div>
            <h1>Registros de tiempo</h1>
            <p class="subtitle">Registra tu tiempo de trabajo</p>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateModal()">
          <mat-icon>add</mat-icon>
          Nuevo registro
        </button>
      </div>

      <div class="filters">
        <div class="date-filter-buttons">
          <button mat-stroked-button
                  [class.active]="selectedDateFilter() === 'last7days'"
                  (click)="setDateFilter('last7days')">
            Últimos 7 días
          </button>
          <button mat-stroked-button
                  [class.active]="selectedDateFilter() === 'last30days'"
                  (click)="setDateFilter('last30days')">
            Últimos 30 días
          </button>
          <button mat-stroked-button
                  [class.active]="selectedDateFilter() === 'thisMonth'"
                  (click)="setDateFilter('thisMonth')">
            Este mes
          </button>
          <button mat-stroked-button
                  [class.active]="selectedDateFilter() === 'lastMonth'"
                  (click)="setDateFilter('lastMonth')">
            Mes anterior
          </button>
          <button mat-stroked-button
                  [class.active]="selectedDateFilter() === 'thisYear'"
                  (click)="setDateFilter('thisYear')">
            Este año
          </button>
        </div>

        <mat-form-field appearance="outline" class="date-field">
          <mat-label>Fecha desde</mat-label>
          <input
            matInput
            [matDatepicker]="startPicker"
            [value]="startDate()"
            (dateChange)="onStartDateChange($event.value)">
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="date-field">
          <mat-label>Fecha hasta</mat-label>
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

        <button mat-raised-button (click)="loadTimeEntries()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </div>

      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-content">
            <mat-icon class="summary-icon">access_time</mat-icon>
            <div class="summary-info">
              <span class="summary-value">{{ totalHours() }}</span>
              <span class="summary-label">Tiempo total</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-content">
            <mat-icon class="summary-icon">list</mat-icon>
            <div class="summary-info">
              <span class="summary-value">{{ totalItems() }}</span>
              <span class="summary-label">Registros totales</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-content">
            <mat-icon class="summary-icon">event</mat-icon>
            <div class="summary-info">
              <span class="summary-value">{{ averageHoursPerDay() }}</span>
              <span class="summary-label">Promedio por día</span>
            </div>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (timeEntries().length === 0) {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">access_time</mat-icon>
          <h2>Sin registros de tiempo</h2>
          <p>Crea tu primer registro de tiempo para comenzar a registrar tu trabajo</p>
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="timeEntries()" class="time-entries-table">
            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let entry">{{ formatDate(entry.startTime) }}</td>
            </ng-container>

            <!-- Project Column -->
            <ng-container matColumnDef="project">
              <th mat-header-cell *matHeaderCellDef>Proyecto</th>
              <td mat-cell *matCellDef="let entry">{{ entry.projectName }}</td>
            </ng-container>

            <!-- Issue Column -->
            <ng-container matColumnDef="issue">
              <th mat-header-cell *matHeaderCellDef>Problema</th>
              <td mat-cell *matCellDef="let entry">{{ entry.issueTitle || '-' }}</td>
            </ng-container>

            <!-- Description Column -->
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Descripción</th>
              <td mat-cell *matCellDef="let entry">
                <span class="description-text">{{ entry.description || 'Sin descripción' }}</span>
              </td>
            </ng-container>

            <!-- Start Time Column -->
            <ng-container matColumnDef="startTime">
              <th mat-header-cell *matHeaderCellDef>Inicio</th>
              <td mat-cell *matCellDef="let entry">{{ formatTime(entry.startTime) }}</td>
            </ng-container>

            <!-- End Time Column -->
            <ng-container matColumnDef="endTime">
              <th mat-header-cell *matHeaderCellDef>Fin</th>
              <td mat-cell *matCellDef="let entry">
                @if (entry.endTime) {
                  {{ formatTime(entry.endTime) }}
                } @else {
                  <span class="active-badge">Activo</span>
                }
              </td>
            </ng-container>

            <!-- Hours Column -->
            <ng-container matColumnDef="hours">
              <th mat-header-cell *matHeaderCellDef>Duración</th>
              <td mat-cell *matCellDef="let entry">
                <span class="hours-badge">{{ formatDuration(entry.durationMinutes) }}</span>
              </td>
            </ng-container>

            <!-- Azure DevOps Column -->
            <ng-container matColumnDef="devops">
              <th mat-header-cell *matHeaderCellDef>DevOps</th>
              <td mat-cell *matCellDef="let entry">
                <mat-checkbox
                  [checked]="entry.registeredInDevOps"
                  [disabled]="devopsUpdatingIds().has(entry.id)"
                  matTooltip="¿Ya está registrado en Azure DevOps?"
                  (change)="onToggleDevOps(entry, $event.checked)">
                </mat-checkbox>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let entry">
                <button mat-icon-button (click)="editEntry(entry)" [disabled]="!entry.endTime">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="confirmDelete(entry)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <mat-paginator
          [length]="totalItems()"
          [pageIndex]="currentPage()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 25, 50, 100]"
          (page)="onPageChange($event)"
          showFirstLastButtons="false"
          aria-label="Seleccionar página">
        </mat-paginator>
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

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    .date-filter-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .date-filter-buttons button {
      transition: all 0.3s ease;
    }

    .date-filter-buttons button.active {
      background-color: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .date-field {
      min-width: 180px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      background-color: var(--mat-sys-surface);
      border-radius: 8px;
      padding: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-primary);
    }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 28px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      line-height: 1;
    }

    .summary-label {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
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

    .table-container {
      overflow-x: auto;
      background-color: var(--mat-sys-surface);
      border-radius: 8px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .time-entries-table {
      width: 100%;
    }

    .description-text {
      display: block;
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .active-badge {
      display: inline-block;
      background-color: #4caf50;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
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

      mat-form-field {
        width: 100%;
      }
    }
  `]
})
export class TimeEntryListComponent implements OnInit {
  private timeEntryService = inject(TimeEntryService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public timeEntries = signal<TimeEntry[]>([]);
  public isLoading = signal<boolean>(false);
  public startDate = signal<Date | null>(null);
  public endDate = signal<Date | null>(null);
  public selectedDateFilter = signal<string>('last7days');

  // Pagination properties
  public totalItems = signal<number>(0);
  public pageSize = signal<number>(10);
  public currentPage = signal<number>(0);
  public totalMinutes = signal<number>(0);

  public displayedColumns: string[] = ['date', 'project', 'issue', 'description', 'startTime', 'endTime', 'hours', 'devops', 'actions'];
  public devopsUpdatingIds = signal<Set<number>>(new Set());

  public totalHours = computed(() => {
    const totalMinutes = this.timeEntries().reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
    return this.formatDuration(totalMinutes);
  });

  public averageHoursPerDay = computed(() => {
    const entries = this.timeEntries();
    if (entries.length === 0) return '0h 0m';

    const uniqueDates = new Set(entries.map(e => this.formatDate(e.startTime)));
    const totalMinutes = entries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
    const averageMinutes = Math.floor(totalMinutes / uniqueDates.size);
    return this.formatDuration(averageMinutes);
  });

  ngOnInit(): void {
    // Subscribe to time entries observable for automatic updates
    this.timeEntryService.timeEntries$.subscribe(entries => {
      // Only update if we're not in the middle of loading paginated results
      if (!this.isLoading()) {
        // This handles real-time updates from start/stop timer
        const currentEntries = this.timeEntries();
        const currentEntryIds = new Set(currentEntries.map(e => e.id));
        const hasNewEntries = entries.some(e => !currentEntryIds.has(e.id));

        // Check if any existing entry has been updated (e.g., timer stopped)
        const hasUpdatedEntries = entries.some(entry => {
          const current = currentEntries.find(e => e.id === entry.id);
          return current && (
            current.endTime !== entry.endTime ||
            current.durationMinutes !== entry.durationMinutes
          );
        });

        if (hasNewEntries || hasUpdatedEntries || entries.length !== currentEntries.length) {
          this.loadTimeEntries();
        }
      }
    });

    // Set default date filter to last 7 days
    this.setDateFilter('last7days');
  }

  setDateFilter(filter: string): void {
    this.selectedDateFilter.set(filter);
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (filter) {
      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    this.startDate.set(startDate);
    this.endDate.set(endDate);
    this.currentPage.set(0); // Reset to first page
    this.loadTimeEntries();
  }

  loadTimeEntries(): void {
    this.isLoading.set(true);
    const startDateStr = this.startDate() ? this.startDate()!.toISOString() : undefined;
    const endDateStr = this.endDate() ? this.endDate()!.toISOString() : undefined;

    this.timeEntryService.getPaginatedTimeEntries(
      this.currentPage(),
      this.pageSize(),
      startDateStr,
      endDateStr
    ).subscribe({
      next: (data) => {
        this.timeEntries.set(data.items);
        this.totalItems.set(data.totalCount);
        this.totalMinutes.set(data.totalMinutes ?? 0);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading time entries:', error);
        this.isLoading.set(false);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to load time entries. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTimeEntries();
  }

  onStartDateChange(date: Date | null): void {
    this.startDate.set(date);
    this.selectedDateFilter.set(''); // Deseleccionar filtro predefinido
    this.currentPage.set(0);
    this.loadTimeEntries();
  }

  onEndDateChange(date: Date | null): void {
    this.endDate.set(date);
    this.selectedDateFilter.set(''); // Deseleccionar filtro predefinido
    this.currentPage.set(0);
    this.loadTimeEntries();
  }

  clearFilters(): void {
    this.startDate.set(null);
    this.endDate.set(null);
    this.selectedDateFilter.set('');
    this.currentPage.set(0);
    this.loadTimeEntries();
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(TimeEntryModalComponent, {
      width: '600px',
      data: { entry: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTimeEntries();
      }
    });
  }

  editEntry(entry: TimeEntry): void {
    const dialogRef = this.dialog.open(TimeEntryModalComponent, {
      width: '600px',
      data: { entry }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTimeEntries();
      }
    });
  }

  confirmDelete(entry: TimeEntry): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Time Entry?',
        message: 'Are you sure you want to delete this entry? This action cannot be undone.'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteEntry(entry.id);
      }
    });
  }

  deleteEntry(id: number): void {
    this.timeEntryService.deleteTimeEntry(id).subscribe({
      next: () => {
        this.toastService.showSuccess('Time entry has been deleted.');
        this.loadTimeEntries();
      },
      error: (error) => {
        console.error('Error deleting time entry:', error);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to delete time entry. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }

  onToggleDevOps(entry: TimeEntry, checked: boolean): void {
    const previousValue = entry.registeredInDevOps;

    // Optimistic update so the checkbox reacts instantly
    this.timeEntries.update(entries =>
      entries.map(e => e.id === entry.id ? { ...e, registeredInDevOps: checked } : e)
    );
    this.devopsUpdatingIds.update(ids => new Set(ids).add(entry.id));

    this.timeEntryService.updateTimeEntry(entry.id, { registeredInDevOps: checked }).subscribe({
      next: () => {
        this.devopsUpdatingIds.update(ids => {
          const next = new Set(ids);
          next.delete(entry.id);
          return next;
        });
      },
      error: (error) => {
        // Revert on failure
        this.timeEntries.update(entries =>
          entries.map(e => e.id === entry.id ? { ...e, registeredInDevOps: previousValue } : e)
        );
        this.devopsUpdatingIds.update(ids => {
          const next = new Set(ids);
          next.delete(entry.id);
          return next;
        });
        console.error('Error updating DevOps flag:', error);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'No se pudo actualizar el estado de Azure DevOps.')
          } as ErrorDialogData
        });
      }
    });
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

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number | null | undefined): string {
    if (!minutes && minutes !== 0) return '0h 0m';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  }
}

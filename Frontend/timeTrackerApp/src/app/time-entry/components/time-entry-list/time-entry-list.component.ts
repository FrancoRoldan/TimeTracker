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
import { TimeEntryService } from '../../services/time-entry.service';
import { TimeEntry } from '../../interfaces';
import { TimeEntryModalComponent } from '../time-entry-modal/time-entry-modal.component';
import Swal from 'sweetalert2';
import { TimeTrackerComponent } from "../time-tracker/time-tracker.component";

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
    MatProgressSpinnerModule
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
          <mat-label>Fecha de finalización</mat-label>
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
          Limpiar filtros
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
              <span class="summary-value">{{ totalHours() }}h</span>
              <span class="summary-label">Horas totales</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-content">
            <mat-icon class="summary-icon">list</mat-icon>
            <div class="summary-info">
              <span class="summary-value">{{ timeEntries().length }}</span>
              <span class="summary-label">Registros</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-content">
            <mat-icon class="summary-icon">event</mat-icon>
            <div class="summary-info">
              <span class="summary-value">{{ averageHoursPerDay() }}h</span>
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
              <td mat-cell *matCellDef="let entry">{{ entry.issueTitle }}</td>
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
              <th mat-header-cell *matHeaderCellDef>Horas</th>
              <td mat-cell *matCellDef="let entry">
                <span class="hours-badge">{{ ((entry.durationMinutes ?? 0) / 60).toFixed(2) }}h</span>
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

  public timeEntries = signal<TimeEntry[]>([]);
  public isLoading = signal<boolean>(false);
  public startDate = signal<Date | null>(null);
  public endDate = signal<Date | null>(null);

  public displayedColumns: string[] = ['date', 'project', 'issue', 'description', 'startTime', 'endTime', 'hours', 'actions'];

  public totalHours = computed(() => {
    return this.timeEntries().reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0).toFixed(2);
  });

  public averageHoursPerDay = computed(() => {
    const entries = this.timeEntries();
    if (entries.length === 0) return '0.00';

    const uniqueDates = new Set(entries.map(e => this.formatDate(e.startTime)));
    const total = entries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
    return (total / uniqueDates.size).toFixed(2);
  });

  ngOnInit(): void {
    // Subscribe to time entries from service
    this.timeEntryService.timeEntries$.subscribe(entries => {
      this.timeEntries.set(entries);
    });

    // Load initial time entries
    this.loadTimeEntries();
  }

  loadTimeEntries(): void {
    this.isLoading.set(true);
    const startDateStr = this.startDate() ? this.startDate()!.toISOString() : undefined;
    const endDateStr = this.endDate() ? this.endDate()!.toISOString() : undefined;

    this.timeEntryService.getTimeEntries(startDateStr, endDateStr).subscribe({
      next: () => {
        // Entries are automatically updated via timeEntries$ subscription
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading time entries:', error);
        this.isLoading.set(false);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load time entries. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  onStartDateChange(date: Date | null): void {
    this.startDate.set(date);
    this.loadTimeEntries();
  }

  onEndDateChange(date: Date | null): void {
    this.endDate.set(date);
    this.loadTimeEntries();
  }

  clearFilters(): void {
    this.startDate.set(null);
    this.endDate.set(null);
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
    Swal.fire({
      title: 'Delete Time Entry?',
      text: `Are you sure you want to delete this entry? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteEntry(entry.id);
      }
    });
  }

  deleteEntry(id: number): void {
    this.timeEntryService.deleteTimeEntry(id).subscribe({
      next: () => {
        Swal.fire({
          title: 'Deleted!',
          text: 'Time entry has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.loadTimeEntries();
      },
      error: (error) => {
        console.error('Error deleting time entry:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete time entry. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

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
import { forkJoin, of } from 'rxjs';
import { TimeEntryService } from '../../services/time-entry.service';
import { TimeEntry } from '../../interfaces';
import { TimeEntryModalComponent } from '../time-entry-modal/time-entry-modal.component';
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
        <!-- Bulk selection bar -->
        @if (selectedCount() > 0) {
          <div class="bulk-bar">
            <div class="bulk-bar-info">
              <mat-icon>done_all</mat-icon>
              <span>{{ selectedCount() }} {{ selectedCount() === 1 ? 'registro seleccionado' : 'registros seleccionados' }}</span>
              <button mat-button (click)="clearSelection()">Cancelar</button>
            </div>
            <div class="bulk-bar-actions">
              <button mat-stroked-button [disabled]="isBulkWorking()" (click)="bulkSetDevOps(true)">
                <mat-icon>cloud_done</mat-icon>
                Marcar en DevOps
              </button>
              <button mat-stroked-button [disabled]="isBulkWorking()" (click)="bulkSetDevOps(false)">
                <mat-icon>cloud_off</mat-icon>
                Desmarcar DevOps
              </button>
              <button mat-stroked-button color="warn" [disabled]="isBulkWorking()" (click)="confirmBulkDelete()">
                <mat-icon>delete</mat-icon>
                Eliminar
              </button>
            </div>
          </div>
        }

        @if (showSelectAllBanner()) {
          <div class="select-all-banner">
            <span>Se seleccionaron los {{ timeEntries().length }} registros de esta página.</span>
            <button mat-button (click)="selectAllMatching()" [disabled]="selectingAll()">
              @if (selectingAll()) {
                <mat-spinner diameter="16" style="display:inline-block; margin-right: 6px;"></mat-spinner>
              }
              Seleccionar los {{ totalItems() }} registros que coinciden con el filtro
            </button>
          </div>
        }

        @if (allFilteredSelected() && totalItems() > timeEntries().length) {
          <div class="select-all-banner">
            <span>Los {{ totalItems() }} registros que coinciden con el filtro están seleccionados.</span>
            <button mat-button (click)="clearSelection()">Quitar selección</button>
          </div>
        }

        <!-- Desktop / tablet table -->
        <div class="table-container">
          <table mat-table [dataSource]="timeEntries()" class="time-entries-table">
            <!-- Select Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox
                  [checked]="isPageFullySelected()"
                  [indeterminate]="isPagePartiallySelected()"
                  aria-label="Seleccionar todos los registros de la página"
                  (change)="toggleAllOnPage()">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let entry">
                <mat-checkbox
                  [checked]="isSelected(entry.id)"
                  [attr.aria-label]="'Seleccionar registro del ' + formatDate(entry.startTime)"
                  (change)="toggleRow(entry.id)">
                </mat-checkbox>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let entry">{{ formatDate(entry.startTime) }}</td>
            </ng-container>

            <!-- Project Column -->
            <ng-container matColumnDef="project">
              <th mat-header-cell *matHeaderCellDef>Proyecto</th>
              <td mat-cell *matCellDef="let entry">
                <span class="truncate-text" [matTooltip]="entry.projectName" matTooltipShowDelay="400">{{ entry.projectName }}</span>
              </td>
            </ng-container>

            <!-- Issue Column -->
            <ng-container matColumnDef="issue">
              <th mat-header-cell *matHeaderCellDef>Problema</th>
              <td mat-cell *matCellDef="let entry">
                <span class="truncate-text" [matTooltip]="entry.issueTitle || ''" matTooltipShowDelay="400">{{ entry.issueTitle || '-' }}</span>
              </td>
            </ng-container>

            <!-- Description Column -->
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Descripción</th>
              <td mat-cell *matCellDef="let entry">
                <span class="truncate-text description-text" [matTooltip]="entry.description || ''" matTooltipShowDelay="400">{{ entry.description || 'Sin descripción' }}</span>
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
              <th mat-header-cell *matHeaderCellDef class="actions-header">Acciones</th>
              <td mat-cell *matCellDef="let entry">
                <div class="row-actions">
                  <button mat-icon-button matTooltip="Editar" (click)="editEntry(entry)" [disabled]="!entry.endTime">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="confirmDelete(entry)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row
                *matRowDef="let row; columns: displayedColumns;"
                class="entry-row"
                [class.selected-row]="isSelected(row.id)"></tr>
          </table>
        </div>

        <!-- Mobile card list -->
        <div class="mobile-cards">
          @for (entry of timeEntries(); track entry.id) {
            <div class="entry-card" [class.selected-row]="isSelected(entry.id)">
              <div class="entry-card-top">
                <mat-checkbox
                  [checked]="isSelected(entry.id)"
                  [attr.aria-label]="'Seleccionar registro del ' + formatDate(entry.startTime)"
                  (change)="toggleRow(entry.id)">
                </mat-checkbox>
                <span class="entry-card-date">{{ formatDate(entry.startTime) }}</span>
                <span class="hours-badge">{{ formatDuration(entry.durationMinutes) }}</span>
              </div>

              <div class="entry-card-body">
                <div class="entry-card-titles">
                  <span class="entry-card-project">{{ entry.projectName }}</span>
                  @if (entry.issueTitle) {
                    <span class="entry-card-issue">{{ entry.issueTitle }}</span>
                  }
                </div>
                @if (entry.description) {
                  <p class="entry-card-description">{{ entry.description }}</p>
                }
                <div class="entry-card-time">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ formatTime(entry.startTime) }}</span>
                  <span>–</span>
                  @if (entry.endTime) {
                    <span>{{ formatTime(entry.endTime) }}</span>
                  } @else {
                    <span class="active-badge">Activo</span>
                  }
                </div>
              </div>

              <div class="entry-card-footer">
                <mat-checkbox
                  [checked]="entry.registeredInDevOps"
                  [disabled]="devopsUpdatingIds().has(entry.id)"
                  (change)="onToggleDevOps(entry, $event.checked)">
                  DevOps
                </mat-checkbox>
                <div class="entry-card-actions">
                  <button mat-icon-button matTooltip="Editar" (click)="editEntry(entry)" [disabled]="!entry.endTime">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="confirmDelete(entry)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
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

    /* Bulk selection bar */
    .bulk-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      background-color: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      border-radius: 8px;
      padding: 8px 16px;
      margin-bottom: 12px;
    }

    .bulk-bar-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .bulk-bar-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .select-all-banner {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      background-color: var(--mat-sys-surface-variant);
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 12px;
      text-align: center;
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

    .time-entries-table th,
    .time-entries-table td {
      font-size: 14px;
      padding-right: 12px;
    }

    .time-entries-table .mat-column-select {
      width: 44px;
      padding-left: 8px;
    }

    .time-entries-table .mat-column-date {
      width: 100px;
      white-space: nowrap;
    }

    .time-entries-table .mat-column-project,
    .time-entries-table .mat-column-issue {
      max-width: 150px;
    }

    .time-entries-table .mat-column-description {
      max-width: 220px;
    }

    .time-entries-table .mat-column-startTime,
    .time-entries-table .mat-column-endTime {
      width: 76px;
      white-space: nowrap;
    }

    .time-entries-table .mat-column-hours {
      width: 90px;
      white-space: nowrap;
    }

    .time-entries-table .mat-column-devops {
      width: 64px;
      text-align: center;
    }

    .time-entries-table .mat-column-actions {
      width: 96px;
    }

    .truncate-text {
      display: block;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .description-text {
      max-width: 220px;
    }

    .active-badge {
      display: inline-block;
      background-color: #4caf50;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }

    .hours-badge {
      font-weight: 600;
      color: var(--mat-sys-primary);
      white-space: nowrap;
    }

    /* Row action buttons: visible on hover/focus only (desktop) */
    .row-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .entry-row:hover .row-actions,
    .entry-row:focus-within .row-actions {
      opacity: 1;
    }

    .entry-row.selected-row {
      background-color: var(--mat-sys-surface-variant);
    }

    /* Touch devices have no hover: keep actions visible */
    @media (hover: none) {
      .row-actions {
        opacity: 1;
      }
    }

    /* Mobile card list: hidden by default, shown under breakpoint */
    .mobile-cards {
      display: none;
    }

    .entry-card {
      background-color: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .entry-card.selected-row {
      border-color: var(--mat-sys-primary);
      background-color: var(--mat-sys-surface-variant);
    }

    .entry-card-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .entry-card-date {
      flex: 1;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .entry-card-body {
      padding-left: 4px;
    }

    .entry-card-titles {
      display: flex;
      flex-direction: column;
      margin-bottom: 4px;
    }

    .entry-card-project {
      font-weight: 600;
      font-size: 15px;
      color: var(--mat-sys-on-surface);
    }

    .entry-card-issue {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .entry-card-description {
      margin: 4px 0;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .entry-card-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .entry-card-time mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .entry-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .entry-card-actions {
      display: flex;
      gap: 4px;
    }

    @media (max-width: 768px) {
      .container {
        padding: 12px;
      }

      .header {
        flex-direction: column;
      }

      .filters {
        flex-direction: column;
        align-items: stretch;
      }

      .date-filter-buttons {
        justify-content: flex-start;
      }

      mat-form-field {
        width: 100%;
      }

      .bulk-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .bulk-bar-actions {
        justify-content: flex-start;
      }

      .table-container {
        display: none;
      }

      .mobile-cards {
        display: block;
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

  public displayedColumns: string[] = ['select', 'date', 'project', 'issue', 'description', 'startTime', 'endTime', 'hours', 'devops', 'actions'];
  public devopsUpdatingIds = signal<Set<number>>(new Set());

  // Selection state (persists across pages so users can select entries beyond the current page)
  public selectedIds = signal<Set<number>>(new Set());
  public selectingAll = signal<boolean>(false);
  public isBulkWorking = signal<boolean>(false);

  public selectedCount = computed(() => this.selectedIds().size);

  public isPageFullySelected = computed(() => {
    const entries = this.timeEntries();
    if (entries.length === 0) return false;
    const selected = this.selectedIds();
    return entries.every(e => selected.has(e.id));
  });

  public isPagePartiallySelected = computed(() => {
    const entries = this.timeEntries();
    const selected = this.selectedIds();
    const count = entries.filter(e => selected.has(e.id)).length;
    return count > 0 && count < entries.length;
  });

  public allFilteredSelected = computed(() => {
    return this.totalItems() > 0 && this.selectedIds().size >= this.totalItems();
  });

  public showSelectAllBanner = computed(() => {
    return this.isPageFullySelected()
      && this.totalItems() > this.timeEntries().length
      && !this.allFilteredSelected();
  });

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
    // React only to timer start/stop happening elsewhere (e.g. the floating tracker widget),
    // not to every mutation of the service's cache (create/update/delete already update
    // this page locally, so reacting to them here would cause needless full reloads).
    this.timeEntryService.activeTimer$.subscribe(() => {
      if (!this.isLoading()) {
        this.loadTimeEntries();
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
    this.clearSelection();
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
    this.clearSelection();
    this.loadTimeEntries();
  }

  onEndDateChange(date: Date | null): void {
    this.endDate.set(date);
    this.selectedDateFilter.set(''); // Deseleccionar filtro predefinido
    this.currentPage.set(0);
    this.clearSelection();
    this.loadTimeEntries();
  }

  clearFilters(): void {
    this.startDate.set(null);
    this.endDate.set(null);
    this.selectedDateFilter.set('');
    this.currentPage.set(0);
    this.clearSelection();
    this.loadTimeEntries();
  }

  // --- Selection ---

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleRow(id: number): void {
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleAllOnPage(): void {
    const pageIds = this.timeEntries().map(e => e.id);
    const shouldSelect = !this.isPageFullySelected();

    this.selectedIds.update(ids => {
      const next = new Set(ids);
      for (const id of pageIds) {
        if (shouldSelect) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }

  selectAllMatching(): void {
    const startDateStr = this.startDate() ? this.startDate()!.toISOString() : undefined;
    const endDateStr = this.endDate() ? this.endDate()!.toISOString() : undefined;

    this.selectingAll.set(true);
    this.timeEntryService.getTimeEntries(startDateStr, endDateStr).subscribe({
      next: (entries) => {
        this.selectedIds.set(new Set(entries.map(e => e.id)));
        this.selectingAll.set(false);
      },
      error: (error) => {
        this.selectingAll.set(false);
        console.error('Error selecting all matching entries:', error);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'No se pudo seleccionar todos los registros.')
          } as ErrorDialogData
        });
      }
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // --- Bulk actions ---

  bulkSetDevOps(value: boolean): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.isBulkWorking.set(true);
    const requests = ids.map(id => this.timeEntryService.updateTimeEntry(id, { registeredInDevOps: value }));

    forkJoin(requests).subscribe({
      next: () => {
        this.isBulkWorking.set(false);
        this.toastService.showSuccess('Registros actualizados.');
        this.clearSelection();
        this.loadTimeEntries();
      },
      error: (error) => {
        this.isBulkWorking.set(false);
        console.error('Error updating entries in bulk:', error);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'No se pudieron actualizar todos los registros seleccionados.')
          } as ErrorDialogData
        });
        this.loadTimeEntries();
      }
    });
  }

  confirmBulkDelete(): void {
    const count = this.selectedCount();
    if (count === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar registros',
        message: `¿Seguro que querés eliminar ${count} ${count === 1 ? 'registro' : 'registros'}? Esta acción no se puede deshacer.`
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bulkDelete();
      }
    });
  }

  bulkDelete(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.isBulkWorking.set(true);
    const requests = ids.map(id => this.timeEntryService.deleteTimeEntry(id));

    forkJoin(requests).subscribe({
      next: () => {
        this.isBulkWorking.set(false);
        this.toastService.showSuccess(`${ids.length} ${ids.length === 1 ? 'registro eliminado' : 'registros eliminados'}.`);
        this.clearSelection();
        this.loadTimeEntries();
      },
      error: (error) => {
        this.isBulkWorking.set(false);
        console.error('Error deleting entries in bulk:', error);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'No se pudieron eliminar todos los registros seleccionados.')
          } as ErrorDialogData
        });
        this.clearSelection();
        this.loadTimeEntries();
      }
    });
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
        this.selectedIds.update(ids => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
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

    // Optimistic update so the checkbox reacts instantly, without reloading the page
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

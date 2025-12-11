import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { TimeEntryService } from '../../services/time-entry.service';
import { IssueService } from '../../../issue/services/issue.service';
import { AudioService } from '../../../shared/services/audio.service';
import { KeyboardShortcutService } from '../../../shared/services/keyboard-shortcut.service';
import { TimeEntry, StartTimerRequest } from '../../interfaces';
import { Issue } from '../../../issue/interfaces';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../../shared/components/error-dialog/error-dialog.component';
import { extractErrorMessage } from '../../../shared/utils/error-handler.util';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-time-tracker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    CdkDrag
  ],
  template: `
    <div class="container">
      <div class="header">
        <div class="header-left">
          <mat-icon class="header-icon" color="primary">timer</mat-icon>
          <div>
            <h1>Rastreador de tiempo</h1>
            <p class="subtitle">Registra tu tiempo de trabajo en tiempo real</p>
          </div>
        </div>
        <div class="header-actions">
          <mat-slide-toggle
            [checked]="soundsEnabled()"
            (change)="toggleSounds()"
            [matTooltip]="soundsEnabled() ? 'Sonido ACTIVADO' : 'Sonido DESACTIVADO'">
            <mat-icon>{{ soundsEnabled() ? 'volume_up' : 'volume_off' }}</mat-icon>
          </mat-slide-toggle>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else {
        <div class="tracker-content">
          @if (activeTimer() && !isMinimized()) {
            <!-- Active Timer (Full View) -->
            <mat-card class="timer-card active" cdkDrag [cdkDragDisabled]="!isDraggable()">
              <mat-card-content>
                <div class="timer-header">
                  <div class="timer-info">
                    <div class="drag-handle" [class.draggable]="isDraggable()">
                      <mat-icon>drag_indicator</mat-icon>
                    </div>
                    <div>
                      <h2>{{ activeTimer()!.issueTitle }}</h2>
                      <p class="project-name">{{ activeTimer()!.projectName }}</p>
                      @if (activeTimer()!.description) {
                        <p class="description">{{ activeTimer()!.description }}</p>
                      }
                    </div>
                  </div>
                  <div class="timer-actions-mini">
                    <button mat-icon-button (click)="minimizeTimer()" matTooltip="Minimizar (Ctrl+Shift+M)">
                      <mat-icon>minimize</mat-icon>
                    </button>
                  </div>
                </div>

                <div class="timer-display">
                  <div class="elapsed-time">
                    <span class="time-value">{{ elapsedTime() }}</span>
                    <span class="time-label">Tiempo transcurrido</span>
                  </div>
                  <div class="start-time-info">
                    <mat-icon>schedule</mat-icon>
                    <span>Iniciado a las {{ formatTime(activeTimer()!.startTime) }}</span>
                  </div>
                </div>

                <div class="timer-actions">
                  <button
                    mat-raised-button
                    color="warn"
                    (click)="stopTimer()"
                    [disabled]="isStopping()"
                    matTooltip="Detener temporizador (Ctrl+Shift+P)">
                    <mat-icon>stop</mat-icon>
                    Detener temporizador
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          } @else if (activeTimer() && isMinimized()) {
            <!-- Minimized Floating Timer -->
            <div class="floating-timer" cdkDrag>
              <div class="floating-content">
                <div class="floating-header">
                  <mat-icon class="timer-icon">timer</mat-icon>
                  <div class="floating-info">
                    <div class="floating-title">{{ activeTimer()!.issueTitle }}</div>
                    <div class="floating-time">{{ elapsedTime() }}</div>
                  </div>
                </div>
                <div class="floating-actions">
                  <button mat-icon-button color="warn" (click)="stopTimer()" [disabled]="isStopping()" matTooltip="Detener">
                    <mat-icon>stop</mat-icon>
                  </button>
                  <button mat-icon-button (click)="expandTimer()" matTooltip="Expandir (Ctrl+Shift+M)">
                    <mat-icon>open_in_full</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <!-- Start Timer Form -->
            <mat-card class="timer-card">
              <mat-card-content>
                <h2>Iniciar registro de tiempo</h2>
                <p class="subtitle-text">Selecciona un problema y comienza a registrar tu trabajo</p>

                <div class="start-form">
                  <mat-form-field class="full-width" appearance="fill">
                    <mat-label>Seleccionar problema</mat-label>
                    <mat-select [(value)]="selectedIssueId">
                      @for (issue of availableIssues(); track issue.id) {
                        <mat-option [value]="issue.id">
                          {{ issue.title }} ({{ issue.projectName }})
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field class="full-width" appearance="fill">
                    <mat-label>Descripción (opcional)</mat-label>
                    <textarea
                      matInput
                      [(ngModel)]="description"
                      placeholder="¿En qué estás trabajando?"
                      rows="3">
                    </textarea>
                  </mat-form-field>

                  <button
                    mat-raised-button
                    color="primary"
                    (click)="startTimer()"
                    [disabled]="!selectedIssueId || isStarting()"
                    class="start-button"
                    matTooltip="Iniciar temporizador (Ctrl+Shift+S)">
                    <mat-icon>play_arrow</mat-icon>
                    Iniciar temporizador
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Recent Time Entries -->
          @if (!isMinimized()) {
            <mat-card class="recent-entries-card">
              <mat-card-header>
                <mat-icon mat-card-avatar color="primary">history</mat-icon>
                <mat-card-title>Registros recientes</mat-card-title>
                <mat-card-subtitle>Tu último registro de tiempo</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (recentEntries().length === 0) {
                  <div class="no-entries">
                    <mat-icon>access_time</mat-icon>
                    <p>Sin registros de tiempo recientes</p>
                  </div>
                } @else {
                  <div class="entries-list">
                    @for (entry of recentEntries(); track entry.id) {
                      <div class="entry-item">
                        <div class="entry-info">
                          <strong>{{ entry.issueTitle }}</strong>
                          <span class="entry-project">{{ entry.projectName }}</span>
                          @if (entry.description) {
                            <p class="entry-description">{{ entry.description }}</p>
                          }
                        </div>
                        <div class="entry-time">
                          <span class="hours">{{ (entry.durationMinutes ?? 0).toFixed(2) }}h</span>
                          <span class="date">{{ formatDate(entry.startTime) }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- Keyboard shortcuts help -->
      <div class="shortcuts-info">
        <mat-icon>keyboard</mat-icon>
        <span>Atajos de teclado:</span>
        <span class="shortcut">Ctrl+Shift+S</span> Iniciar
        <span class="shortcut">Ctrl+Shift+P</span> Detener
        <span class="shortcut">Ctrl+Shift+M</span> Minimizar
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .container {
      padding: 20px;
      max-width: 1000px;
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

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .tracker-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .timer-card {
      background-color: var(--mat-sys-surface);
    }

    .timer-card.active {
      border: 2px solid var(--mat-sys-primary);
    }

    .timer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
    }

    .timer-info {
      display: flex;
      gap: 12px;
      flex: 1;
    }

    .drag-handle {
      display: flex;
      align-items: center;
      cursor: default;
      color: var(--mat-sys-on-surface-variant);
    }

    .drag-handle.draggable {
      cursor: move;
    }

    .timer-actions-mini {
      display: flex;
      gap: 8px;
    }

    .timer-info h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: var(--mat-sys-on-surface);
    }

    .project-name {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      font-weight: 500;
    }

    .description {
      margin: 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .timer-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
      background-color: var(--mat-sys-tertiary-container);
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .elapsed-time {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .time-value {
      font-size: 64px;
      font-weight: 700;
      color: var(--mat-sys-primary);
      font-family: 'Courier New', monospace;
      line-height: 1;
    }

    .time-label {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .start-time-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-on-surface-variant);
    }

    .timer-actions {
      display: flex;
      justify-content: center;
    }

    /* Floating Timer Styles */
    .floating-timer {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      background-color: var(--mat-sys-primary-container);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
      min-width: 320px;
      cursor: move;
    }

    .floating-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .floating-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .timer-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--mat-sys-primary);
    }

    .floating-info {
      flex: 1;
    }

    .floating-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .floating-time {
      font-size: 20px;
      font-weight: 700;
      color: var(--mat-sys-primary);
      font-family: 'Courier New', monospace;
    }

    .floating-actions {
      display: flex;
      gap: 4px;
    }

    .subtitle-text {
      margin: 8px 0 24px 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .start-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .start-button {
      align-self: flex-start;
    }

    .recent-entries-card {
      background-color: var(--mat-sys-surface);
    }

    .no-entries {
      text-align: center;
      padding: 40px;
      color: var(--mat-sys-on-surface-variant);
      opacity: 0.5;
    }

    .no-entries mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    .entries-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .entry-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px;
      background-color: var(--mat-sys-tertiary-container);
      border-radius: 8px;
      gap: 16px;
    }

    .entry-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .entry-info strong {
      color: var(--mat-sys-on-surface);
    }

    .entry-project {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .entry-description {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .entry-time {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .hours {
      font-size: 20px;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .date {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .shortcuts-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background-color: var(--mat-sys-tertiary-container);
      border-radius: 8px;
      margin-top: 24px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .shortcuts-info mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .shortcut {
      display: inline-block;
      padding: 4px 8px;
      background-color: var(--mat-sys-surface);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-weight: 500;
      margin: 0 4px;
    }

    @media (max-width: 768px) {
      .timer-header {
        flex-direction: column;
      }

      .time-value {
        font-size: 48px;
      }

      .floating-timer {
        min-width: 280px;
        bottom: 16px;
        right: 16px;
      }

      .shortcuts-info {
        flex-wrap: wrap;
      }
    }
  `]
})
export class TimeTrackerComponent implements OnInit, OnDestroy {
  private timeEntryService = inject(TimeEntryService);
  private issueService = inject(IssueService);
  private audioService = inject(AudioService);
  private keyboardService = inject(KeyboardShortcutService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public isLoading = signal<boolean>(false);
  public isStarting = signal<boolean>(false);
  public isStopping = signal<boolean>(false);
  public activeTimer = signal<TimeEntry | null>(null);
  public availableIssues = signal<Issue[]>([]);
  public recentEntries = signal<TimeEntry[]>([]);
  public elapsedTime = signal<string>('00:00:00');
  public isMinimized = signal<boolean>(false);
  public isDraggable = signal<boolean>(true);
  public soundsEnabled = signal<boolean>(true);

  public selectedIssueId: number | null = null;
  public description: string = '';

  private timerInterval: any;
  private shortcutIds: string[] = [];

  ngOnInit(): void {
    // Load minimize state from localStorage
    const minimizeState = localStorage.getItem('timer-minimized');
    if (minimizeState !== null) {
      this.isMinimized.set(minimizeState === 'true');
    }

    // Load sound preference
    this.soundsEnabled.set(this.audioService.areSoundsEnabled());

    // Register keyboard shortcuts
    this.registerKeyboardShortcuts();

    // Load data
    this.loadData();
    this.startElapsedTimeUpdater();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Unregister keyboard shortcuts
    this.shortcutIds.forEach(id => this.keyboardService.unregisterShortcut(id));
  }

  registerKeyboardShortcuts(): void {
    // Ctrl+Shift+S - Start timer
    const startId = this.keyboardService.registerShortcut({
      key: 'S',
      ctrlKey: true,
      shiftKey: true,
      callback: () => {
        if (this.selectedIssueId && !this.activeTimer()) {
          this.startTimer();
        }
      },
      description: 'Start timer'
    });
    this.shortcutIds.push(startId);

    // Ctrl+Shift+P - Stop timer
    const stopId = this.keyboardService.registerShortcut({
      key: 'P',
      ctrlKey: true,
      shiftKey: true,
      callback: () => {
        if (this.activeTimer()) {
          this.stopTimer();
        }
      },
      description: 'Stop timer'
    });
    this.shortcutIds.push(stopId);

    // Ctrl+Shift+M - Minimize/Maximize timer
    const minimizeId = this.keyboardService.registerShortcut({
      key: 'M',
      ctrlKey: true,
      shiftKey: true,
      callback: () => {
        if (this.activeTimer()) {
          if (this.isMinimized()) {
            this.expandTimer();
          } else {
            this.minimizeTimer();
          }
        }
      },
      description: 'Minimize/Maximize timer'
    });
    this.shortcutIds.push(minimizeId);
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load active timer
    this.timeEntryService.getActiveTimer().subscribe({
      next: (timer) => {
        this.activeTimer.set(timer);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading active timer:', error);
        this.isLoading.set(false);
      }
    });

    // Load available issues
    this.issueService.getMyIssues().subscribe({
      next: (issues) => {
        this.availableIssues.set(issues);
      },
      error: (error) => {
        console.error('Error loading issues:', error);
      }
    });

    // Load recent entries
    this.timeEntryService.getTimeEntries().subscribe({
      next: (entries: TimeEntry[]) => {
        this.recentEntries.set(entries.slice(0, 5));
      },
      error: (error: any) => {
        console.error('Error loading recent entries:', error);
      }
    });
  }

  startTimer(): void {
    if (!this.selectedIssueId) {
      return;
    }

    this.isStarting.set(true);

    const request: StartTimerRequest = {
      issueId: this.selectedIssueId,
      description: this.description || undefined
    };

    this.timeEntryService.startTimer(request).subscribe({
      next: (timer) => {
        this.activeTimer.set(timer);
        this.isStarting.set(false);
        this.selectedIssueId = null;
        this.description = '';

        // Play start sound
        this.audioService.playStartSound();

        this.toastService.showSuccess('Your work time is now being tracked');
      },
      error: (error) => {
        console.error('Error starting timer:', error);
        this.isStarting.set(false);

        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to start timer. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }

  stopTimer(): void {
    if (!this.activeTimer()) {
      return;
    }

    this.isStopping.set(true);

    this.timeEntryService.stopTimer().subscribe({
      next: (stoppedEntry) => {
        this.isStopping.set(false);
        this.activeTimer.set(null);
        this.isMinimized.set(false);
        localStorage.removeItem('timer-minimized');

        // Play stop sound
        this.audioService.playStopSound();

        // Reload recent entries
        this.timeEntryService.getTimeEntries().subscribe({
          next: (entries: TimeEntry[]) => {
            this.recentEntries.set(entries.slice(0, 5));
          }
        });

        this.toastService.showSuccess(`Total time: ${(stoppedEntry.durationMinutes ?? 0).toFixed(2)} hours`);
      },
      error: (error: any) => {
        console.error('Error stopping timer:', error);
        this.isStopping.set(false);

        this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'Error!',
            message: extractErrorMessage(error, 'Failed to stop timer. Please try again.')
          } as ErrorDialogData
        });
      }
    });
  }

  minimizeTimer(): void {
    this.isMinimized.set(true);
    localStorage.setItem('timer-minimized', 'true');
  }

  expandTimer(): void {
    this.isMinimized.set(false);
    localStorage.setItem('timer-minimized', 'false');
  }

  toggleSounds(): void {
    const enabled = this.audioService.toggleSounds();
    this.soundsEnabled.set(enabled);
  }

  startElapsedTimeUpdater(): void {
    this.timerInterval = setInterval(() => {
      if (this.activeTimer()) {
        const start = new Date(this.activeTimer()!.startTime);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        this.elapsedTime.set(formatted);
      }
    }, 1000);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

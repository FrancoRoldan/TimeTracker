import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimeEntryService } from '../../../time-entry/services/time-entry.service';
import { TimeEntry } from '../../../time-entry/interfaces';
import { StartTimerModalComponent } from '../start-timer-modal/start-timer-modal.component';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-floating-timer-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    @if (shouldShowButton()) {
      @if (!activeTimer()) {
        <!-- Play Button - No active timer (only in time-entries page) -->
        <button
          mat-fab
          color="primary"
          class="floating-timer-btn"
          (click)="openStartTimerModal()"
          matTooltip="Iniciar temporizador"
          matTooltipPosition="right">
          <mat-icon>play_arrow</mat-icon>
        </button>
      } @else {
        <!-- Active Timer Widget (visible on all pages when timer is running) -->
        <div class="active-timer-widget">
          <div class="timer-info">
            <div class="timer-header">
              <mat-icon class="timer-icon">timer</mat-icon>
              <span class="timer-elapsed">{{ elapsedTime() }}</span>
            </div>
            <div class="timer-details">
              <div class="timer-project">{{ activeTimer()?.projectName }}</div>
              <div class="timer-issue">{{ activeTimer()?.issueTitle }}</div>
            </div>
          </div>
          <button
            mat-mini-fab
            color="warn"
            class="stop-btn"
            (click)="stopTimer()"
            matTooltip="Detener temporizador"
            matTooltipPosition="right">
            <mat-icon>stop</mat-icon>
          </button>
        </div>
      }
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .floating-timer-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .active-timer-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      background-color: var(--mat-sys-surface);
      border: 2px solid var(--mat-sys-primary);
      border-radius: 28px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 280px;
      max-width: 350px;
    }

    .timer-info {
      flex: 1;
      min-width: 0;
    }

    .timer-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .timer-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-primary);
    }

    .timer-elapsed {
      font-size: 18px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      font-variant-numeric: tabular-nums;
    }

    .timer-details {
      font-size: 13px;
      line-height: 1.4;
    }

    .timer-project {
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .timer-issue {
      color: var(--mat-sys-on-surface-variant);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stop-btn {
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .floating-timer-btn {
        bottom: 16px;
        right: 16px;
      }

      .active-timer-widget {
        bottom: 16px;
        right: 16px;
        min-width: 240px;
        max-width: calc(100vw - 80px);
      }
    }
  `]
})
export class FloatingTimerButtonComponent implements OnInit, OnDestroy {
  private timeEntryService = inject(TimeEntryService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  public activeTimer = signal<TimeEntry | null>(null);
  public elapsedTime = signal<string>('00:00:00');
  public currentUrl = signal<string>(this.router.url);

  // Show button only in time-entries page OR when there's an active timer
  public shouldShowButton = computed(() => {
    const isInTimeEntries = this.currentUrl().includes('/time-entries');
    const hasActiveTimer = this.activeTimer() !== null;
    return isInTimeEntries || hasActiveTimer;
  });

  private timerSubscription?: Subscription;
  private intervalSubscription?: Subscription;
  private routerSubscription?: Subscription;

  ngOnInit(): void {
    // Subscribe to router events to detect navigation changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });

    // Subscribe to active timer
    this.timerSubscription = this.timeEntryService.activeTimer$.subscribe(timer => {
      this.activeTimer.set(timer);

      if (timer) {
        this.startElapsedTimeUpdate();
      } else {
        this.stopElapsedTimeUpdate();
      }
    });

    // Load active timer on init
    this.timeEntryService.getActiveTimer().subscribe();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
    this.stopElapsedTimeUpdate();
  }

  openStartTimerModal(): void {
    const dialogRef = this.dialog.open(StartTimerModalComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Timer started successfully
      }
    });
  }

  stopTimer(): void {
    this.timeEntryService.stopTimer().subscribe({
      next: () => {
        // Timer stopped successfully
      },
      error: (error) => {
        console.error('Error stopping timer:', error);
      }
    });
  }

  private startElapsedTimeUpdate(): void {
    this.stopElapsedTimeUpdate();
    this.updateElapsedTime();

    // Update every second
    this.intervalSubscription = interval(1000).subscribe(() => {
      this.updateElapsedTime();
    });
  }

  private stopElapsedTimeUpdate(): void {
    this.intervalSubscription?.unsubscribe();
    this.elapsedTime.set('00:00:00');
  }

  private updateElapsedTime(): void {
    const timer = this.activeTimer();
    if (!timer || !timer.startTime) return;

    const start = new Date(timer.startTime).getTime();
    const now = new Date().getTime();
    const elapsed = Math.floor((now - start) / 1000); // seconds

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    this.elapsedTime.set(formatted);
  }
}

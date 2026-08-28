import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TelemetryService } from '../../shared/services/telemetry.service';
import { TimeEntry, CreateTimeEntryRequest, UpdateTimeEntryRequest, StartTimerRequest, PaginatedResult } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  private http = inject(HttpClient);
  private telemetry = inject(TelemetryService);
  private baseUrl = `${environment.baseUrl}/time`;

  // State management
  private timeEntriesSubject = new BehaviorSubject<TimeEntry[]>([]);
  public timeEntries$ = this.timeEntriesSubject.asObservable();

  private activeTimerSubject = new BehaviorSubject<TimeEntry | null>(null);
  public activeTimer$ = this.activeTimerSubject.asObservable();

  // Get all time entries with optional filters
  getTimeEntries(dateFrom?: string, dateTo?: string, projectId?: number, issueId?: number): Observable<TimeEntry[]> {
    let params = new HttpParams();
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }
    if (projectId !== undefined) {
      params = params.set('projectId', projectId.toString());
    }
    if (issueId !== undefined) {
      params = params.set('issueId', issueId.toString());
    }

    return this.http.get<TimeEntry[]>(`${this.baseUrl}/entries`, { params }).pipe(
      tap(entries => this.timeEntriesSubject.next(entries))
    );
  }

  // Get paginated time entries with optional filters
  getPaginatedTimeEntries(
    pageNumber: number = 0,
    pageSize: number = 10,
    dateFrom?: string,
    dateTo?: string,
    projectId?: number,
    issueId?: number,
    searchTerm?: string
  ): Observable<PaginatedResult<TimeEntry>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }
    if (projectId !== undefined) {
      params = params.set('projectId', projectId.toString());
    }
    if (issueId !== undefined) {
      params = params.set('issueId', issueId.toString());
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<PaginatedResult<TimeEntry>>(`${this.baseUrl}/entries/paginated`, { params });
  }

  // Get time entry by ID
  getTimeEntryById(id: number): Observable<TimeEntry> {
    return this.http.get<TimeEntry>(`${this.baseUrl}/entries/${id}`);
  }

  // Create manual time entry
  createTimeEntry(request: CreateTimeEntryRequest): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(`${this.baseUrl}/manual`, request).pipe(
      tap(newEntry => {
        const currentEntries = this.timeEntriesSubject.value;
        this.timeEntriesSubject.next([newEntry, ...currentEntries]);
      })
    );
  }

  // Update time entry
  updateTimeEntry(id: number, request: UpdateTimeEntryRequest): Observable<TimeEntry> {
    return this.http.put<TimeEntry>(`${this.baseUrl}/entries/${id}`, request).pipe(
      tap(updatedEntry => {
        const currentEntries = this.timeEntriesSubject.value;
        const updatedEntries = currentEntries.map(entry =>
          entry.id === id ? updatedEntry : entry
        );
        this.timeEntriesSubject.next(updatedEntries);
      })
    );
  }

  // Delete time entry
  deleteTimeEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/entries/${id}`).pipe(
      tap(() => {
        const currentEntries = this.timeEntriesSubject.value;
        const filteredEntries = currentEntries.filter(entry => entry.id !== id);
        this.timeEntriesSubject.next(filteredEntries);
      })
    );
  }

  // Start timer
  startTimer(request: StartTimerRequest): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(`${this.baseUrl}/start`, request).pipe(
      tap(activeEntry => {
        this.activeTimerSubject.next(activeEntry);
        const currentEntries = this.timeEntriesSubject.value;
        this.timeEntriesSubject.next([activeEntry, ...currentEntries]);
      })
    );
  }

  // Stop timer
  stopTimer(): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(`${this.baseUrl}/stop`, {}).pipe(
      tap(stoppedEntry => {
        this.activeTimerSubject.next(null);
        const currentEntries = this.timeEntriesSubject.value;
        const updatedEntries = currentEntries.map(entry =>
          entry.id === stoppedEntry.id ? stoppedEntry : entry
        );
        this.timeEntriesSubject.next(updatedEntries);
      })
    );
  }

  // Get active timer
  getActiveTimer(): Observable<TimeEntry | null> {
    return this.http.get<TimeEntry | null>(`${this.baseUrl}/active`).pipe(
      tap(activeEntry => this.activeTimerSubject.next(activeEntry)),
      catchError((error) => {
        // 404 es un estado válido del dominio: el usuario no tiene timer activo.
        if (error.status === 404) {
          this.activeTimerSubject.next(null);
          return of(null);
        }

        // Cualquier otro error es una degradación real, no "no hay timer".
        //
        // Se sigue devolviendo null en lugar de propagar el error porque el
        // dashboard consume esta llamada dentro de un forkJoin y propagarla
        // tumbaría la carga completa del tablero. Pero antes se dejaba constancia
        // solo en la consola del usuario (hallazgo A12): ahora queda registrada,
        // con lo que un pico de fallos acá es visible en los dashboards.
        this.telemetry.trackEvent('active_timer_degraded', {
          statusCode: String(error?.status ?? 0)
        });
        this.activeTimerSubject.next(null);
        return of(null);
      })
    );
  }

  // Clear time entries state
  clearTimeEntries(): void {
    this.timeEntriesSubject.next([]);
  }

  // Set active timer (for local state management)
  setActiveTimer(timer: TimeEntry | null): void {
    this.activeTimerSubject.next(timer);
  }
}

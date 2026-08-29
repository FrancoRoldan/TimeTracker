import { HttpClient, HttpParams } from '@angular/common/http';
import { TelemetryService } from '../../shared/services/telemetry.service';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Issue, CreateIssueRequest, UpdateIssueRequest, AssignIssueRequest } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  private http = inject(HttpClient);
  private telemetry = inject(TelemetryService);
  private baseUrl = `${environment.baseUrl}/issue`;

  // State management
  private issuesSubject = new BehaviorSubject<Issue[]>([]);
  public issues$ = this.issuesSubject.asObservable();

  private selectedIssueSubject = new BehaviorSubject<Issue | null>(null);
  public selectedIssue$ = this.selectedIssueSubject.asObservable();

  // Get all issues with optional filters
  getIssues(companyId?: number, status?: number, type?: number,priority?: number): Observable<Issue[]> {
    let params = new HttpParams();
    
    if (companyId !== undefined) {
      params = params.set('companyId', companyId!.toString());
    }

    if (status !== undefined) {
      params = params.set('status', status.toString());
    }
    if (type !== undefined) {
      params = params.set('type', type.toString());
    }
    if (priority !== undefined) {
      params = params.set('assignedUserId', priority.toString());
    }

    return this.http.get<Issue[]>(`${this.baseUrl}/my-companies`, { params }).pipe(
      tap(issues => this.issuesSubject.next(issues))
    );
  }

  // Get issue by ID
  getIssueById(id: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.baseUrl}/${id}`).pipe(
      tap(issue => this.selectedIssueSubject.next(issue))
    );
  }

  // Create new issue
  createIssue(request: CreateIssueRequest): Observable<Issue> {
    return this.http.post<Issue>(this.baseUrl, request).pipe(
      tap(newIssue => {
        this.telemetry.trackEvent('issue_created', {
          tipo: String(newIssue.type ?? ''),
          prioridad: String(newIssue.priority ?? '')
        });
        const currentIssues = this.issuesSubject.value;
        this.issuesSubject.next([...currentIssues, newIssue]);
      })
    );
  }

  // Update issue
  updateIssue(id: number, request: UpdateIssueRequest): Observable<Issue> {
    return this.http.put<Issue>(`${this.baseUrl}/${id}`, request).pipe(
      tap(updatedIssue => {
        const currentIssues = this.issuesSubject.value;
        const updatedIssues = currentIssues.map(issue =>
          issue.id === id ? updatedIssue : issue
        );
        this.issuesSubject.next(updatedIssues);
        this.selectedIssueSubject.next(updatedIssue);
      })
    );
  }

  // Delete issue
  deleteIssue(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const currentIssues = this.issuesSubject.value;
        const filteredIssues = currentIssues.filter(issue => issue.id !== id);
        this.issuesSubject.next(filteredIssues);
        if (this.selectedIssueSubject.value?.id === id) {
          this.selectedIssueSubject.next(null);
        }
      })
    );
  }

  // Assign issue to user
  assignIssue(issueId: number, request: AssignIssueRequest): Observable<Issue> {
    return this.http.put<Issue>(`${this.baseUrl}/${issueId}/assign`, request).pipe(
      tap(updatedIssue => {
        this.telemetry.trackEvent('issue_assigned');
        const currentIssues = this.issuesSubject.value;
        const updatedIssues = currentIssues.map(issue =>
          issue.id === issueId ? updatedIssue : issue
        );
        this.issuesSubject.next(updatedIssues);
        this.selectedIssueSubject.next(updatedIssue);
      })
    );
  }

  // Get issues assigned to current user
  getMyIssues(companyId?: number): Observable<Issue[]> {
    let params = new HttpParams();
    if (companyId !== undefined) {
      params = params.set('companyId', companyId.toString());
    }
    return this.http.get<Issue[]>(`${this.baseUrl}/assigned-to-me`, { params }).pipe(
      tap(issues => this.issuesSubject.next(issues))
    );
  }

  // Get issues by project
  getIssuesByProject(projectId: number): Observable<Issue[]> {
    return this.http.get<Issue[]>(`${this.baseUrl}/project/${projectId}`).pipe(
      tap(issues => this.issuesSubject.next(issues))
    );
  }

  getMyIssuesByProject(projectId: number): Observable<Issue[]> {
    return this.http.get<Issue[]>(`${this.baseUrl}/project/${projectId}/assigned-to-me`).pipe(
      tap(issues => this.issuesSubject.next(issues))
    );
  }

  // Update issue status (for Kanban board)
  updateIssueStatus(id: number, status: number): Observable<Issue> {
    this.telemetry.trackEvent('issue_status_changed', { estado: String(status) });
    return this.updateIssue(id, { status: status });
  }

  // Select issue for detail view
  selectIssue(issue: Issue | null): void {
    this.selectedIssueSubject.next(issue);
  }

  // Clear issues state
  clearIssues(): void {
    this.issuesSubject.next([]);
    this.selectedIssueSubject.next(null);
  }
}

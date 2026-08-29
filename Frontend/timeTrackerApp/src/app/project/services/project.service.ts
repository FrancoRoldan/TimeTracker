import { Injectable, inject } from '@angular/core';
import { TelemetryService } from '../../shared/services/telemetry.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private telemetry = inject(TelemetryService);
  private urlApi = environment.baseUrl;

  // State management
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  private selectedProjectSubject = new BehaviorSubject<Project | null>(null);
  public selectedProject$ = this.selectedProjectSubject.asObservable();

  /**
   * Get all projects for the authenticated user
   * @param companyId Optional company ID filter
   */
  getProjects(companyId?: number): Observable<Project[]> {
    let params = new HttpParams();
    if (companyId) {
      params = params.set('companyId', companyId.toString());
    }

    return this.http.get<Project[]>(`${this.urlApi}/project`, { params })
      .pipe(
        tap(projects => this.projectsSubject.next(projects))
      );
  }

  /**
   * Get a specific project by ID
   */
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.urlApi}/project/${id}`)
      .pipe(
        tap(project => this.selectedProjectSubject.next(project))
      );
  }

  /**
   * Create a new project
   */
  createProject(data: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${this.urlApi}/project`, data)
      .pipe(
        tap(newProject => {
          this.telemetry.trackEvent('project_created');
          // Add to projects list
          const currentProjects = this.projectsSubject.value;
          this.projectsSubject.next([...currentProjects, newProject]);
        })
      );
  }

  /**
   * Update a project
   */
  updateProject(id: number, data: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.urlApi}/project/${id}`, data)
      .pipe(
        tap(updatedProject => {
          // Update in projects list
          const currentProjects = this.projectsSubject.value;
          const index = currentProjects.findIndex(p => p.id === id);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }

          // Update selected project if it's the one being updated
          if (this.selectedProjectSubject.value?.id === id) {
            this.selectedProjectSubject.next(updatedProject);
          }
        })
      );
  }

  /**
   * Delete a project (soft delete)
   */
  deleteProject(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.urlApi}/project/${id}`)
      .pipe(
        tap(() => {
          // Remove from projects list
          const currentProjects = this.projectsSubject.value;
          this.projectsSubject.next(currentProjects.filter(p => p.id !== id));

          // Clear selected project if it's the one being deleted
          if (this.selectedProjectSubject.value?.id === id) {
            this.selectedProjectSubject.next(null);
          }
        })
      );
  }

  /**
   * Get all issues for a specific project
   */
  getProjectIssues(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlApi}/project/${id}/issues`);
  }

  /**
   * Select a project as the current active project
   */
  selectProject(project: Project): void {
    this.selectedProjectSubject.next(project);
  }

  /**
   * Get the currently selected project
   */
  getSelectedProject(): Project | null {
    return this.selectedProjectSubject.value;
  }

  /**
   * Clear selected project
   */
  clearSelectedProject(): void {
    this.selectedProjectSubject.next(null);
  }

  /**
   * Refresh projects list
   */
  refreshProjects(companyId?: number): void {
    this.getProjects(companyId).subscribe();
  }
}

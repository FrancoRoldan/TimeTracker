import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../services/project.service';
import { CompanyService } from '../../../company/services/company.service';
import { Project } from '../../interfaces';
import { ProjectStatus } from '../../../core/enums';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectModalComponent } from '../project-modal/project-modal.component';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ProjectCardComponent,
    EnumLabelPipe
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Proyectos</h1>
        <button mat-raised-button color="primary" (click)="openCreateModal()" [disabled]="!selectedCompany()">
          <mat-icon>add</mat-icon>
          Crear proyecto
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <mat-form-field appearance="fill" class="filter-field">
          <mat-label>Filtrar por estado</mat-label>
          <mat-select [(value)]="statusFilter" (selectionChange)="applyFilters()">
            <mat-option [value]="null">Todos los estados</mat-option>
            <mat-option [value]="ProjectStatus.Active">
              {{ ProjectStatus.Active | enumLabel:'ProjectStatus' }}
            </mat-option>
            <mat-option [value]="ProjectStatus.OnHold">
              {{ ProjectStatus.OnHold | enumLabel:'ProjectStatus' }}
            </mat-option>
            <mat-option [value]="ProjectStatus.Completed">
              {{ ProjectStatus.Completed | enumLabel:'ProjectStatus' }}
            </mat-option>
            <mat-option [value]="ProjectStatus.Cancelled">
              {{ ProjectStatus.Cancelled | enumLabel:'ProjectStatus' }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="filter-field">
          <mat-label>Buscar</mat-label>
          <input matInput [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Buscar por nombre...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        @if (filteredProjects().length > 0) {
          <div class="results-count">
            {{ filteredProjects().length }} {{ filteredProjects().length === 1 ? 'proyecto encontrado' : 'proyectos encontrados' }}
          </div>
        }
      </div>

      @if (!selectedCompany()) {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">business</mat-icon>
          <h2>Selecciona primero una empresa</h2>
          <p>Selecciona una empresa en la barra lateral para ver proyectos</p>
        </div>
      } @else if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner [diameter]="50"></mat-spinner>
        </div>
      } @else if (filteredProjects().length === 0 && !searchTerm && statusFilter === null) {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">folder</mat-icon>
          <h2>Aún no hay proyectos</h2>
          <p>Crea tu primer proyecto para empezar</p>
          <button mat-raised-button color="primary" (click)="openCreateModal()">
            <mat-icon>add</mat-icon>
            Crear proyecto
          </button>
        </div>
      } @else if (filteredProjects().length === 0) {
        <div class="no-data">
          <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">search_off</mat-icon>
          <h2>No se encontraron proyectos</h2>
          <p>Prueba ajustando tus filtros</p>
          <button mat-button (click)="clearFilters()">
            Limpiar filtros
          </button>
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of filteredProjects(); track project.id) {
            <app-project-card
              [project]="project"
              (viewProject)="viewProject($event)"
              (editProject)="editProject($event)"
              (deleteProject)="confirmDelete($event)">
            </app-project-card>
          }
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
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .filters-section {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .filter-field {
      min-width: 200px;
    }

    .results-count {
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      margin-left: auto;
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
      margin: 0 0 24px 0;
      font-size: 16px;
      opacity: 0.8;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-field {
        width: 100%;
      }

      .results-count {
        margin-left: 0;
      }

      .projects-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private companyService = inject(CompanyService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  public projects = signal<Project[]>([]);
  public isLoading = signal<boolean>(false);
  public selectedCompany = signal<any>(null);

  public searchTerm: string = '';
  public statusFilter: ProjectStatus | null = null;
  public ProjectStatus = ProjectStatus;

  public filteredProjects = computed(() => {
    let result = this.projects();

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term));
    }

    // Filter by status
    if (this.statusFilter !== null) {
      result = result.filter(p => p.status === this.statusFilter);
    }

    return result;
  });

  ngOnInit(): void {
    // Subscribe to selected company
    this.companyService.selectedCompany$.subscribe(company => {
      this.selectedCompany.set(company);
      if (company) {
        this.loadProjects(company.id);
      } else {
        this.projects.set([]);
      }
    });
  }

  loadProjects(companyId: number): void {
    this.isLoading.set(true);
    this.projectService.getProjects(companyId).subscribe({
      next: (projects) => {
        console.log('Projects loaded in component:', projects);
        this.projects.set(projects);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.isLoading.set(false);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load projects. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  applyFilters(): void {
    // Triggers computed signal recalculation
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = null;
  }

  openCreateModal(): void {
    if (!this.selectedCompany()) {
      Swal.fire({
        title: 'No Company Selected',
        text: 'Please select a company first',
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }
    debugger
    console.log('Opening create project modal for company:', this.selectedCompany());
    const dialogRef = this.dialog.open(ProjectModalComponent, {
      width: '600px',
      data: { project: null, companyId: this.selectedCompany().id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProjects(this.selectedCompany().id);
      }
    });
  }

  viewProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  editProject(project: Project): void {
    const dialogRef = this.dialog.open(ProjectModalComponent, {
      width: '600px',
      data: { project, companyId: project.companyId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProjects(this.selectedCompany().id);
      }
    });
  }

  confirmDelete(project: Project): void {
    Swal.fire({
      title: 'Delete Project?',
      text: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteProject(project);
      }
    });
  }

  deleteProject(project: Project): void {
    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        Swal.fire({
          title: 'Deleted!',
          text: `Project "${project.name}" has been deleted.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.loadProjects(this.selectedCompany().id);
      },
      error: (error) => {
        console.error('Error deleting project:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete project. Please try again.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }
}

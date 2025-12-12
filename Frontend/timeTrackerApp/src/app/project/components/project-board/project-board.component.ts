import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips'; // Opcional, para contadores bonitos

// Tus imports de servicios e interfaces...
import { IssueService } from '../../../issue/services/issue.service';
import { Issue } from '../../../issue/interfaces';
import { IssueStatus } from '../../../core/enums';
import { IssueCardComponent } from '../../../issue/components/issue-card/issue-card.component';
import { IssueModalComponent } from '../../../issue/components/issue-modal/issue-modal.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog-component/confirm-dialog-component.component';
import { ToastService } from '../../../shared/services/toast.service';

interface BoardColumn {
  id: IssueStatus;
  title: string;
  issues: Issue[];
  colorClass: string; // Nueva propiedad para estilos
}

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    IssueCardComponent,
    MatChipsModule
  ],
  template: `
    <div class="board-wrapper">
      <div class="header">
        <div class="header-content">
          <div>
            <h2 class="mat-headline-small">Tablero del Proyecto</h2>
            <p class="subtitle mat-body-medium">Gestiona y rastrea tus incidencias</p>
          </div>
          <button mat-flat-button color="primary" (click)="openCreateModal()">
            <mat-icon>add</mat-icon>
            Nueva Incidencia
          </button>
        </div>
      </div>

      <div class="board-content">
        @if (isLoading()) {
          <div class="loading-overlay">
            <mat-spinner [diameter]="48"></mat-spinner>
          </div>
        } @else {
          <div class="board-columns" cdkDropListGroup>
            @for (column of columns(); track column.id) {
              <div class="column {{column.colorClass}}">
                
                <div class="column-header">
                  <div class="header-title">
                    <span class="status-indicator"></span>
                    <h3>{{ column.title }}</h3>
                  </div>
                  <div class="badge">{{ column.issues.length }}</div>
                </div>

                <div
                  class="column-list custom-scrollbar"
                  cdkDropList
                  [cdkDropListData]="column.issues"
                  (cdkDropListDropped)="onDrop($event, column.id)">
                  
                  @for (issue of column.issues; track issue.id) {
                    <div class="issue-card-wrapper" cdkDrag>
                      <div class="custom-placeholder" *cdkDragPlaceholder></div>
                      
                      <app-issue-card
                        [issue]="issue"
                        (viewIssue)="viewIssue($event)"
                        (editIssue)="openEditModal($event)"
                        (deleteIssue)="confirmDeleteIssue($event)"
                      />
                    </div>
                  }

                  @if (column.issues.length === 0) {
                    <div class="empty-state">
                      <mat-icon class="empty-icon">dashboard_customize</mat-icon>
                      <p>Sin tareas</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .board-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: var(--mat-sys-background);
    }

    /* --- Header --- */
    .header {
      padding: 1rem 2rem;
      background-color: var(--mat-sys-surface);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1600px;
      margin: 0 auto;
    }

    .header h2 {
      margin: 0;
      color: var(--mat-sys-on-surface);
      font-weight: 600;
    }

    .subtitle {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    /* --- Board Layout --- */
    .board-content {
      flex: 1;
      overflow-x: auto; /* Scroll horizontal para el tablero */
      overflow-y: hidden;
      padding: 24px;
      /* Scrollbar styling for the main board area */
      scrollbar-width: thin;
      scrollbar-color: var(--mat-sys-outline-variant) transparent;
    }

    .board-columns {
      display: flex;
      gap: 24px;
      height: 100%;
      min-width: fit-content; /* Asegura que las columnas no se aplasten */
    }

    /* --- Column Styling --- */
    .column {
      width: 320px; /* Ancho fijo óptimo para lectura */
      min-width: 320px;
      display: flex;
      flex-direction: column;
      background-color: var(--mat-sys-surface-container-low); /* Fondo sutil */
      border-radius: 12px;
      height: 100%;
      max-height: calc(100vh - 180px); /* Ajuste para evitar doble scroll */
      transition: background-color 0.2s ease;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .column-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: grab;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container);
      border-radius: 12px 12px 0 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .column-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-sys-on-surface);
    }

    /* Badge count style */
    .badge {
      background-color: var(--mat-sys-surface-variant);
      color: var(--mat-sys-on-surface-variant);
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Status Colors */
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .col-todo .status-indicator { background-color: var(--mat-sys-outline); }
    .col-todo { border-top: 3px solid var(--mat-sys-outline); }

    .col-progress .status-indicator { background-color: #3b82f6; } /* Azul manual o var custom */
    .col-progress { border-top: 3px solid #3b82f6; }

    .col-testing .status-indicator { background-color: #f59e0b; } /* Ambar */
    .col-testing { border-top: 3px solid #f59e0b; }

    .col-done .status-indicator { background-color: #10b981; } /* Verde */
    .col-done { border-top: 3px solid #10b981; }

    /* --- List & Content --- */
    .column-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Custom Scrollbar for columns */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: var(--mat-sys-outline-variant);
      border-radius: 10px;
    }

    .issue-card-wrapper {
      cursor: pointer;
    }

    /* --- CDK Drag & Drop Visuals --- */
    
    /* El elemento que se está moviendo (la "fantasma") */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
      /* Importante para que mantenga el estilo al arrastrar */
      background-color: var(--mat-sys-surface); 
    }

    /* El hueco donde va a caer */
    .custom-placeholder {
      min-height: 100px;
      border: 2px dashed var(--mat-sys-outline);
      background-color: var(--mat-sys-surface-variant);
      border-radius: 8px;
      opacity: 0.6;
      margin-bottom: 12px;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .column-list.cdk-drop-list-dragging .issue-card-wrapper:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* --- Empty State --- */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      opacity: 0.6;
      color: var(--mat-sys-on-surface-variant);
    }
    
    .empty-icon {
      font-size: 40px;
      height: 40px;
      width: 40px;
      margin-bottom: 8px;
      color: var(--mat-sys-outline);
    }

    .loading-overlay {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }
  `]
})
export class ProjectIssueBoardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private issueService = inject(IssueService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  public issues = signal<Issue[]>([]);
  public isLoading = signal<boolean>(false);
  public columns = signal<BoardColumn[]>([]);

  private projectId: number = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.initializeColumns();
    this.loadIssues();
  }

  initializeColumns(): void {
    // Agregamos 'colorClass' para estilar cada columna distintamente
    this.columns.set([
      { id: IssueStatus.ToDo, title: 'Por hacer', issues: [], colorClass: 'col-todo' },
      { id: IssueStatus.InProgress, title: 'En Progreso', issues: [], colorClass: 'col-progress' },
      { id: IssueStatus.Testing, title: 'En Pruebas', issues: [], colorClass: 'col-testing' },
      { id: IssueStatus.Done, title: 'Completado', issues: [], colorClass: 'col-done' }
    ]);
  }

  loadIssues(): void {
    this.isLoading.set(true);
    this.issueService.getIssuesByProject(this.projectId).subscribe({
      next: (issues: Issue[]) => {
        this.issues.set(issues);
        this.organizeIssuesByStatus(issues);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading issues:', error);
        this.isLoading.set(false);
        this.toastService.showError('Error al cargar incidencias');
      }
    });
  }

  organizeIssuesByStatus(issues: Issue[]): void {
    const newColumns = this.columns().map(column => ({
      ...column,
      issues: issues.filter(issue => issue.status === column.id)
    }));
    this.columns.set(newColumns);
  }

  onDrop(event: CdkDragDrop<Issue[]>, newStatus: IssueStatus): void {
    const issue = event.previousContainer.data[event.previousIndex];

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.updateIssueStatus(issue, newStatus);
    }
  }

  updateIssueStatus(issue: Issue, newStatus: IssueStatus): void {
    this.issueService.updateIssueStatus(issue.id, newStatus).subscribe({
      next: () => {
        this.toastService.showSuccess('Estado actualizado');
      },
      error: (error) => {
        console.error('Error updating issue status:', error);
        this.toastService.showError('Error al actualizar estado');
        this.loadIssues(); // Revertir cambios visuales
      }
    });
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '600px',
      data: { projectId: this.projectId },
      // Opcional: panelClass para estilos del modal
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIssues();
        this.toastService.showSuccess('Incidencia creada');
      }
    });
  }

  viewIssue(issue: Issue): void {
    this.router.navigate(['/issues', issue.id]);
  }

  openEditModal(issue: Issue): void {
    const dialogRef = this.dialog.open(IssueModalComponent, {
      width: '600px',
      data: { issue, projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadIssues();
        this.toastService.showSuccess('Incidencia actualizada');
      }
    });
  }

  confirmDeleteIssue(issue: Issue): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar incidencia',
        message: `¿Estás seguro de que quieres eliminar "${issue.title}"?`
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteIssue(issue.id);
      }
    });
  }

  deleteIssue(issueId: number): void {
    this.issueService.deleteIssue(issueId).subscribe({
      next: () => {
        this.loadIssues();
        this.toastService.showSuccess('Incidencia eliminada');
      },
      error: (error: any) => {
        this.toastService.showError('Error al eliminar');
      }
    });
  }
}

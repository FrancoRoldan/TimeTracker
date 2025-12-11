import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../auth/interfaces/user.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Bienvenido a Time Tracker</h1>
        @if(user()) {
          <p class="subtitle">¡Hola, {{ user()?.name }}!</p>
        }
      </div>

      <div class="dashboard-grid">
        <!-- Companies Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">business</mat-icon>
            <mat-card-title>Empresas</mat-card-title>
            <mat-card-subtitle>Gestiona tus organizaciones</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Ver y gestionar las empresas a las que perteneces.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/companies">
              Ir a Empresas
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Projects Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">folder</mat-icon>
            <mat-card-title>Proyectos</mat-card-title>
            <mat-card-subtitle>Gestiona tus proyectos</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Crea y gestiona proyectos en tus empresas.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/projects">
              Ir a Proyectos
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Issues Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">assignment</mat-icon>
            <mat-card-title>Incidencias</mat-card-title>
            <mat-card-subtitle>Gestiona tus tareas</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Ver incidencias, seguir el progreso y gestionar asignaciones.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/issues">
              Ver todas las incidencias
            </button>
            <button mat-button routerLink="/issues/my-issues">
              Mis incidencias
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Time Tracking Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">timer</mat-icon>
            <mat-card-title>Registro de tiempo</mat-card-title>
            <mat-card-subtitle>Registra tus horas de trabajo</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Inicia temporizadores, registra entradas manuales y ve tus registros de tiempo.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/time">
              Registrar tiempo
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Reports Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">assessment</mat-icon>
            <mat-card-title>Informes</mat-card-title>
            <mat-card-subtitle>Ver análisis</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Genera informes y analiza los datos de registro de tiempo.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/reports">
              Ver informes
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Kanban Board Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">view_kanban</mat-icon>
            <mat-card-title>Tablero Kanban</mat-card-title>
            <mat-card-subtitle>Visualiza el flujo de trabajo</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Arrastra y suelta incidencias para gestionar el estado y el flujo de trabajo.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/issues/board">
              Abrir tablero
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Quick Start Guide -->
      <mat-card class="quick-start-card">
          <mat-card-header>
          <mat-icon mat-card-avatar color="accent">lightbulb</mat-icon>
          <mat-card-title>Guía de inicio rápido</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ol class="quick-start-list">
            <li>
              <strong>Crea o únete a una empresa:</strong> Ve a Empresas para comenzar con tu organización.
            </li>
            <li>
              <strong>Configura un proyecto:</strong> Crea proyectos dentro de tu empresa para organizar el trabajo.
            </li>
            <li>
              <strong>Crea incidencias:</strong> Añade tareas, errores o historias de usuario a tus proyectos.
            </li>
            <li>
              <strong>Registra tu tiempo:</strong> Inicia un temporizador cuando trabajes en incidencias para registrar horas automáticamente.
            </li>
            <li>
              <strong>Ver informes:</strong> Analiza la productividad y la asignación de tiempo entre proyectos.
            </li>
          </ol>
        </mat-card-content>
      </mat-card>
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
      margin-bottom: 32px;
    }

    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .subtitle {
      margin: 8px 0 0 0;
      font-size: 18px;
      color: var(--mat-sys-on-surface-variant);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .dashboard-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .dashboard-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .dashboard-card mat-card-header {
      margin-bottom: 16px;
    }

    .dashboard-card mat-card-content {
      min-height: 60px;
    }

    .dashboard-card mat-card-actions {
      padding: 0 16px 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .quick-start-card {
      background-color: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    .quick-start-list {
      margin: 0;
      padding-left: 20px;
    }

    .quick-start-list li {
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .quick-start-list li:last-child {
      margin-bottom: 0;
    }

    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .header h1 {
        font-size: 24px;
      }

      .subtitle {
        font-size: 16px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  public user = signal<User | null>(null);

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user.set(user);
    });
  }
}

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
        <h1>Welcome to Time Tracker</h1>
        @if(user()) {
          <p class="subtitle">Hello, {{ user()?.nombre }}!</p>
        }
      </div>

      <div class="dashboard-grid">
        <!-- Companies Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">business</mat-icon>
            <mat-card-title>Companies</mat-card-title>
            <mat-card-subtitle>Manage your organizations</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>View and manage companies you belong to.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/companies">
              Go to Companies
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Projects Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">folder</mat-icon>
            <mat-card-title>Projects</mat-card-title>
            <mat-card-subtitle>Track your projects</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Create and manage projects across your companies.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/projects">
              Go to Projects
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Issues Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">assignment</mat-icon>
            <mat-card-title>Issues</mat-card-title>
            <mat-card-subtitle>Manage your tasks</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>View issues, track progress, and manage assignments.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/issues">
              View All Issues
            </button>
            <button mat-button routerLink="/issues/my-issues">
              My Issues
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Time Tracking Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">timer</mat-icon>
            <mat-card-title>Time Tracking</mat-card-title>
            <mat-card-subtitle>Track your work hours</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Start timers, log manual entries, and view your time logs.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/time">
              Track Time
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Reports Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">assessment</mat-icon>
            <mat-card-title>Reports</mat-card-title>
            <mat-card-subtitle>View analytics</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Generate reports and analyze time tracking data.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/reports">
              View Reports
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Kanban Board Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">view_kanban</mat-icon>
            <mat-card-title>Kanban Board</mat-card-title>
            <mat-card-subtitle>Visualize workflow</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Drag and drop issues to manage status and workflow.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/issues/board">
              Open Board
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Quick Start Guide -->
      <mat-card class="quick-start-card">
        <mat-card-header>
          <mat-icon mat-card-avatar color="accent">lightbulb</mat-icon>
          <mat-card-title>Quick Start Guide</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ol class="quick-start-list">
            <li>
              <strong>Create or join a company:</strong> Go to Companies to get started with your organization.
            </li>
            <li>
              <strong>Set up a project:</strong> Create projects within your company to organize work.
            </li>
            <li>
              <strong>Create issues:</strong> Add tasks, bugs, or user stories to your projects.
            </li>
            <li>
              <strong>Track your time:</strong> Start a timer when working on issues to log hours automatically.
            </li>
            <li>
              <strong>View reports:</strong> Analyze productivity and time allocation across projects.
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

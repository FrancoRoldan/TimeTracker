import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-layout-login',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule
  ],
  template: `
  <div class="container">
      <mat-card class="login-card" appearance="outlined">
        <mat-card-content>
        <router-outlet></router-outlet>
        </mat-card-content>
      </mat-card>
  </div>
  `,
  styles: `
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 90vh;
  }

  .login-card {
    min-width: 200px;
    max-width: 400px;
    padding: 2rem;
    margin: 0 auto;
    min-height: 400px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 20px;
  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutLoginComponent { }

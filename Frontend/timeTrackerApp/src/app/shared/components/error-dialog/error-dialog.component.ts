import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ErrorDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-error-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <mat-icon color="warn" class="icon-pulse">error</mat-icon>
      <h2 mat-dialog-title>{{ data.title }}</h2>
    </div>
    <mat-dialog-content>
      <p class="dialog-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="center">
      <button mat-raised-button color="warn" (click)="onYesClick()">Aceptar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0 10px 0;
      color: var(--mat-sys-error);
    }

    .dialog-header h2 {
      margin-top: 10px;
      font-size: 1.8em;
      font-weight: 600;
    }

    .icon-pulse {
      font-size: 48px;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }

    .dialog-message {
      font-size: 1.05em;
      line-height: 1.5;
      text-align: center;
      margin-bottom: 25px;
    }

    .mat-mdc-dialog-container .mat-mdc-dialog-surface {
      border-radius: 12px;
      box-shadow: 0 var(--app-hover-shadow-strength) var(--app-hover-shadow-color);
      max-width: 400px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData
  ) {}

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}

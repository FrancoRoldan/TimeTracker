import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../auth/services/auth.service';
import { ButtonsThemeComponent } from "../buttons-theme/buttons-theme.component";

@Component({
  selector: 'app-right-side-bar',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    ButtonsThemeComponent
],
  template: `
        <mat-toolbar>
            <button mat-icon-button (click)="toggle();">
                <mat-icon>close</mat-icon>
            </button>
            <span class="spacer"></span>
            <span >Configuración</span>
        </mat-toolbar>

        <div class="text-center">
          <app-buttons-theme/>
        </div>
        
        <mat-nav-list >
          <mat-list-item (click)="logout()">
            <mat-icon color="primary" matListItemIcon>logout</mat-icon>
            <span>Salir</span>
          </mat-list-item> 
        </mat-nav-list>
  `,
  styleUrl: './right-side-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RightSideBarComponent { 
  toogleOutput = output<boolean>();
  private authService = inject(AuthService);

  toggle() {
    this.toogleOutput.emit(true);
  }

  logout():void{
    this.authService.logout();
  }
}

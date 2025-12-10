import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ThemeService } from '../../services/theme-service.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-buttons-theme',
  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatIconModule
  ],
  template: `
  <mat-accordion>
  <mat-expansion-panel (opened)="panelOpenState.set(true)" (closed)="panelOpenState.set(false)">
    <mat-expansion-panel-header>
      <mat-panel-title> Tema </mat-panel-title>
      
    </mat-expansion-panel-header>
    <p>
      <mat-slide-toggle labelPosition="before" [checked]="isDarkMode()" (change)="switchDark()">
        @if(isDarkMode()){
          <mat-icon>dark_mode</mat-icon>
        }
        @else{
          <mat-icon>light_mode</mat-icon>
        }
        
      </mat-slide-toggle>
    </p>
  
  <div class="theme-grid">
      <div
        class="theme-block blue"
        (click)="changeTheme('azul')"
        title="Tema Azul"
      ></div>
      <div
        class="theme-block ocre"
        (click)="changeTheme('ocre')"
        title="Tema Ocre"
      ></div>
      <div
        class="theme-block violet"
        (click)="changeTheme('third')"
        title="Tema Violeta"
      ></div>
      <div
        class="theme-block pink"
        (click)="changeTheme('pink')"
        title="Tema Rosa"
      ></div>
      <div
        class="theme-block green"
        (click)="changeTheme('green')"
        title="Tema Verde"
      ></div>
      <div
        class="theme-block orange"
        (click)="changeTheme('orange')"
        title="Tema Naranja"
      ></div>
    </div>
  </mat-expansion-panel>
  </mat-accordion>
  `,
  styleUrl: './buttons-theme.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonsThemeComponent {
  private config:ThemeService = inject(ThemeService);
  readonly panelOpenState = signal(false);

  switchDark():void{
    this.config.toogleDarkMode();
  }

  isDarkMode(){
    return this.config.getDarkMode();
  }
  
  changeTheme(theme:string):void{
      this.config.changeTheme(theme);
  }

 }

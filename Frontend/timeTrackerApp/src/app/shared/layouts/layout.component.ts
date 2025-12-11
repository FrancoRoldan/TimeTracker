import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { LeftSideBarComponent } from '../../shared/components/left-side-bar/left-side-bar.component';
import { RightSideBarComponent } from '../../shared/components/right-side-bar/right-side-bar.component';
import { FloatingTimerButtonComponent } from '../../shared/components/floating-timer-button/floating-timer-button.component';
import { AuthService } from '../../auth/services/auth.service';
import { User } from '../../auth/interfaces/user.interface';

@Component({
    selector: 'app-layout',
    imports: [
        CommonModule,
        RouterModule,
        LeftSideBarComponent,
        RightSideBarComponent,
        FloatingTimerButtonComponent,
        MatSidenavModule,
        MatListModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule
    ],
    template: `
    <mat-sidenav-container  fullscreen>

    <mat-sidenav #sidenav mode="over" [ngStyle]="{width:'230px'}" [opened]="!isMobile()" 
        [mode]="(!isMobile()) ? 'side' : 'over'" style="background-color: var(--mat-sys-surface-container-high)">
        <app-left-side-bar (toogleOutput)="toggleSideNav()" [isMobile]="isMobile()"></app-left-side-bar>
    </mat-sidenav>
    

    <mat-toolbar>
        @if(isMobile()){
            <button mat-icon-button (click)="sidenav.toggle()">
                    <mat-icon>menu</mat-icon>
            </button>
        }

        <span class="spacer"></span>

        <p class="profile-avatar m-2 mr-2"> 
            <strong>{{ user()?.name?.slice(0,2) | titlecase }}</strong>
        </p>

        <button class="ml-2" mat-icon-button (click)="rightnav.toggle()">
            <mat-icon>settings</mat-icon>
        </button>
    </mat-toolbar>

    <mat-sidenav #rightnav  position="end" [ngStyle]="{width:'230px'}">
        <app-right-side-bar (toogleOutput)="toggleRight()"></app-right-side-bar>
    </mat-sidenav>
    
    <!-- start body -->
    <section>
        <div class="container mt-2">
            <router-outlet></router-outlet>
        </div>
    </section>
    <!-- end body -->

    <!-- Floating Timer Button (Global) -->
    <app-floating-timer-button></app-floating-timer-button>

    </mat-sidenav-container>
  `,
    styles: `
    profile-avatar {
        background: linear-gradient(135deg, var(--mat-sys-primary) 0%, var(--mat-sys-tertiary) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        box-shadow: 0 var(--app-hover-shadow-strength) var(--app-hover-shadow-color);
        color: var(--mat-sys-on-primary);
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
    @ViewChild('rightnav') rightnav!: MatSidenav;
    @ViewChild('sidenav') sidenav!: MatSidenav;

    public screenWidth = signal<number>(0);
    public isMobile = computed<boolean>(() => this.screenWidth() < 840);
    public user = signal<User | null>(null);
    private authService = inject(AuthService);
    

    constructor() {
        this.screenWidth.set(window.innerWidth);
        this.user.set(this.authService.user);
        console.log('Current user in layout:', this.user());
        window.onresize = () => {
            this.screenWidth.set(window.innerWidth);
        };
    }
  
    toggleRight() {
      this.rightnav.toggle();          
    }
  
    toggleSideNav() {
      this.sidenav.toggle();
    }
 }

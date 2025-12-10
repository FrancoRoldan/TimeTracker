import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Menu } from '../../interfaces/menu.interface';
import { RouterModule } from '@angular/router';
import { CompanyService } from '../../../company/services/company.service';
import { Company } from '../../../company/interfaces';

@Component({
  selector: 'app-left-side-bar',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    RouterModule
  ],
  template: `
        <mat-toolbar>
            <span>Menu</span>
            <span class="spacer"></span>
            @if(isMobile()){
              <button mat-icon-button (click)="toggle();">
                <mat-icon>close</mat-icon>
              </button>
            }
        </mat-toolbar>

        <!-- Company Selector -->
        <div class="selector-container">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Active Company</mat-label>
            <mat-select
              [value]="selectedCompany()?.id"
              (selectionChange)="onCompanyChange($event.value)">
              <mat-option [value]="null">
                <em>No company selected</em>
              </mat-option>
              @for (company of companies(); track company.id) {
                <mat-option [value]="company.id">
                  {{ company.name }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-nav-list>
            @for(item of menuItems; track $index){
              <mat-list-item [routerLink]="item.url"  [routerLinkActiveOptions]="{exact:true}"
              (click)="toggle()" routerLinkActive #rla="routerLinkActive"  [activated]="rla.isActive">
                <mat-icon color="primary" matListItemIcon>{{item.icon}}</mat-icon>
                {{item.tittle}}
              </mat-list-item>
            }
        </mat-nav-list>
 `,
  styleUrl: './left-side-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftSideBarComponent implements OnInit {
  private companyService = inject(CompanyService);

  toogleOutput = output<boolean>();
  isMobile = input.required<boolean>();

  public companies = signal<Company[]>([]);
  public selectedCompany = signal<Company | null>(null);

  menuItems: Menu[] = [
    { tittle: "Dashboard", url: "/dashboard", icon: "home" },
    { tittle: "Companies", url: "/companies", icon: "business" },
    { tittle: "Projects", url: "/projects", icon: "folder" },
    { tittle: "Issues", url: "/issues", icon: "assignment" },
    { tittle: "My Issues", url: "/issues/my-issues", icon: "person" },
    { tittle: "Board", url: "/issues/board", icon: "view_kanban" },
    { tittle: "Time Tracking", url: "/time-entries", icon: "timer" },
    { tittle: "My Reports", url: "/reports/user", icon: "bar_chart" },
    { tittle: "Project Reports", url: "/reports/project", icon: "pie_chart" },
    { tittle: "Company Reports", url: "/reports/company", icon: "assessment" },
  ];

  ngOnInit(): void {
    // Subscribe to companies
    this.companyService.companies$.subscribe(companies => {
      this.companies.set(companies);
    });

    // Subscribe to selected company
    this.companyService.selectedCompany$.subscribe(company => {
      this.selectedCompany.set(company);
    });

    // Load companies on init
    this.companyService.getCompanies().subscribe();
  }

  onCompanyChange(companyId: number | null): void {
    console.log('Company change requested:', companyId);
    console.log('Available companies:', this.companies());

    if (!companyId) {
      this.companyService.clearSelectedCompany();
      return;
    }

    const company = this.companies().find(c => c.id === companyId);
    console.log('Found company:', company);

    if (company) {
      if (!company.id) {
        console.error('Company found but has no Id:', company);
        return;
      }
      this.companyService.selectCompany(company);
    } else {
      console.error('Company not found with Id:', companyId);
    }
  }

  toggle() {
    if(this.isMobile()){
      this.toogleOutput.emit(true);
    }
  }
}

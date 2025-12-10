import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'user',
    pathMatch: 'full'
  },
  {
    path: 'user',
    loadComponent: () => import('./components/user-report/user-report.component').then(m => m.UserReportComponent)
  },
  {
    path: 'project',
    loadComponent: () => import('./components/project-report/project-report.component').then(m => m.ProjectReportComponent)
  },
  {
    path: 'company',
    loadComponent: () => import('./components/company-report/company-report.component').then(m => m.CompanyReportComponent)
    // Note: RoleGuard protection can be added here if needed:
    // canActivate: [RoleGuard],
    // data: { roles: ['Admin', 'Manager'] }
  }
];

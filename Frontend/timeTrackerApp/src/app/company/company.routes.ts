import { Routes } from '@angular/router';
import { CompanyListComponent } from './components/company-list/company-list.component';
import { CompanyUsersComponent } from './components/company-users/company-users.component';

export const routes: Routes = [
  {
    path: '',
    component: CompanyListComponent
  },
  {
    path: ':id/users',
    component: CompanyUsersComponent
  }
];

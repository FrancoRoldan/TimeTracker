import { Routes } from '@angular/router';
import { IssueDetailComponent } from './components/issue-detail/issue-detail.component';

export const routes: Routes = [
  // Solo mantener la ruta de detalle para acceso directo
  {
    path: ':id',
    component: IssueDetailComponent
  }
];

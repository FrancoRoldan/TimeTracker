import { Routes } from '@angular/router';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: ProjectListComponent
  },
  {
    path: ':id',
    component: ProjectDetailComponent
  }
];

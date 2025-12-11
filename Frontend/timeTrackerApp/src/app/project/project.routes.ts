import { Routes } from '@angular/router';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { IssueDetailComponent } from '../issue/components/issue-detail/issue-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: ProjectListComponent
  },
  {
    path: ':id',
    component: ProjectDetailComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./components/project-overview/project-overview.component')
          .then(m => m.ProjectOverviewComponent)
      },
      {
        path: 'issues',
        loadComponent: () => import('./components/project-issues/project-issues.component')
          .then(m => m.ProjectIssuesComponent)
      },
      {
        path: 'board',
        loadComponent: () => import('./components/project-board/project-board.component')
          .then(m => m.ProjectIssueBoardComponent)
      },
      {
        path: 'issues/:issueId',
        component: IssueDetailComponent
      }
    ]
  }
];

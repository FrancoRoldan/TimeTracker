import { Routes } from '@angular/router';
import { IssueListComponent } from './components/issue-list/issue-list.component';
import { IssueDetailComponent } from './components/issue-detail/issue-detail.component';
import { MyIssuesComponent } from './components/my-issues/my-issues.component';
import { IssueBoardComponent } from './components/issue-board/issue-board.component';

export const routes: Routes = [
  {
    path: '',
    component: IssueListComponent
  },
  {
    path: 'my-issues',
    component: MyIssuesComponent
  },
  {
    path: 'board',
    component: IssueBoardComponent
  },
  {
    path: ':id',
    component: IssueDetailComponent
  }
];

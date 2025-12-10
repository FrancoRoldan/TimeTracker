import { Routes } from '@angular/router';
import { TimeEntryListComponent } from './components/time-entry-list/time-entry-list.component';
import { TimeTrackerComponent } from './components/time-tracker/time-tracker.component';

export const routes: Routes = [
  {
    path: '',
    component: TimeEntryListComponent
  },
  {
    path: 'tracker',
    component: TimeTrackerComponent
  }
];

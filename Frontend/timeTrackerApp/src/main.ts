import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LoginInterceptor } from './shared/services/login-interceptor.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes,withViewTransitions(),), 
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideHttpClient(
      withInterceptors([LoginInterceptor])
    ),
  ]
};

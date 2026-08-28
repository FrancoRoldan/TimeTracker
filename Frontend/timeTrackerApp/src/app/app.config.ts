import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, ErrorHandler, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LoginInterceptor } from './shared/services/login-interceptor.interceptor';
import { GlobalErrorHandler } from './shared/services/global-error-handler';
import { TelemetryService } from './shared/services/telemetry.service';
import { registerWebVitals } from './shared/services/web-vitals';

// Register Spanish locale
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes,withViewTransitions(),),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideHttpClient(
      withInterceptors([LoginInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },

    // Observabilidad del frontend (Fase 3 del plan).
    // Captura los errores que no son HTTP: renderizado, código asíncrono y
    // carga de chunks. Los HTTP los reporta el LoginInterceptor con su contexto.
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    provideAppInitializer(() => {
      const telemetry = inject(TelemetryService);
      telemetry.start();
      registerWebVitals(telemetry);
    }),
  ]
};

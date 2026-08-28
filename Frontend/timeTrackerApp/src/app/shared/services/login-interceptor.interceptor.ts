import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { BehaviorSubject, Observable, filter, catchError, switchMap, take, tap, throwError } from "rxjs";
import { AuthService } from "../../auth/services/auth.service";
import { TelemetryService } from "./telemetry.service";
import { createTraceContext } from "../utils/trace-context.util";
import { extractErrorMessage } from "../utils/error-handler.util";

/**
 * Estado compartido del refresh de token.
 *
 * Antes, N respuestas 401 concurrentes disparaban N refreshes en paralelo (hallazgo
 * A15): cada uno invalidaba el token del anterior, generando ruido de 401 y reintentos
 * no idempotentes sobre operaciones de escritura. Ahora el primer 401 refresca y el
 * resto espera el resultado.
 */
let refreshInProgress = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

export function LoginInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const token: string = localStorage.getItem("token") ?? '';
  const authService = inject(AuthService);
  const telemetry = inject(TelemetryService);

  // La telemetría no pasa por acá: se envía con fetch para no realimentar el ciclo
  // (un 401 de telemetría dispararía un refresh, que podría reportar otro error).
  if (req.url.includes('/telemetry')) {
    return next(req);
  }

  // Skip authentication for public routes
  if (req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/refresh')) {
    return next(req);
  }

  // Get selected company from localStorage
  const selectedCompanyStr = localStorage.getItem("selectedCompany");
  let companyId: number | null = null;

  if (selectedCompanyStr) {
    try {
      const selectedCompany = JSON.parse(selectedCompanyStr);
      companyId = selectedCompany.id;
    } catch (e) {
      telemetry.trackError(e, { errorSource: 'selected_company_parse' });
    }
  }

  // Contexto de traza: hace que el span del backend cuelgue del mismo árbol que
  // la interacción del usuario, en lugar de empezar en la API.
  const trace = createTraceContext();
  const startedAt = performance.now();

  const buildHeaders = (accessToken: string) => {
    let headers = req.headers
      .set('Authorization', `Bearer ${accessToken}`)
      .set('traceparent', trace.header);

    if (companyId !== null) {
      headers = headers.set('X-Company-Id', companyId.toString());
    }
    return headers;
  };

  const reqWithHeader = req.clone({ headers: buildHeaders(token) });

  return next(reqWithHeader).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        const duration = performance.now() - startedAt;
        // Solo se reportan las llamadas lentas: registrar todas duplicaría lo que
        // ya mide el backend y multiplicaría el volumen de telemetría.
        if (duration > 3000) {
          telemetry.trackEvent('slow_api_call', {
            method: req.method,
            durationBucket: duration > 10000 ? '>10s' : '>3s'
          });
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handleUnauthorized(req, next, authService, telemetry, buildHeaders, trace.traceId, startedAt);
      }

      reportApiError(telemetry, req, error, trace.traceId, startedAt);
      return throwError(() => error);
    })
  );
}

function handleUnauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  telemetry: TelemetryService,
  buildHeaders: (token: string) => HttpRequest<unknown>['headers'],
  traceId: string,
  startedAt: number
): Observable<HttpEvent<unknown>> {

  // Ya hay un refresh en curso: esperar su resultado en lugar de lanzar otro.
  if (refreshInProgress) {
    return refreshedToken$.pipe(
      filter((newToken): newToken is string => newToken !== null),
      take(1),
      switchMap(newToken => next(req.clone({ headers: buildHeaders(newToken) })))
    );
  }

  refreshInProgress = true;
  refreshedToken$.next(null);

  return authService.refreshToken().pipe(
    switchMap(newToken => {
      refreshInProgress = false;
      refreshedToken$.next(newToken.token);

      return next(req.clone({ headers: buildHeaders(newToken.token) }));
    }),
    catchError(err => {
      refreshInProgress = false;

      telemetry.trackApiError({
        method: req.method,
        url: req.url,
        statusCode: 401,
        durationMs: performance.now() - startedAt,
        message: 'Token refresh failed',
        traceId
      });

      // Un refresh fallido significa que la sesión terminó. Antes el error solo
      // llegaba al componente y el usuario quedaba en una sesión zombi.
      authService.logout();

      return throwError(() => err);
    })
  );
}

function reportApiError(
  telemetry: TelemetryService,
  req: HttpRequest<unknown>,
  error: HttpErrorResponse,
  traceId: string,
  startedAt: number
): void {
  telemetry.trackApiError({
    method: req.method,
    url: req.url,
    statusCode: error.status,
    durationMs: performance.now() - startedAt,
    message: extractErrorMessage(error),
    traceId
  });
}

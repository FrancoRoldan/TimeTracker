import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * Telemetría del frontend (§15 a §19 del plan de observabilidad).
 *
 * Envía errores, Web Vitals y eventos de uso a POST {baseUrl}/telemetry, que los
 * publica como logs y métricas junto a los del backend.
 *
 * Reglas que este servicio garantiza:
 *  - Nunca bloquea una operación del usuario: encola, agrupa y envía en segundo plano.
 *  - Nunca envía secretos ni PII: el token, el email y cualquier campo sensible se
 *    redactan antes de salir del navegador (el backend además vuelve a sanear).
 *  - Nunca lanza: un fallo de telemetría no puede romper la aplicación.
 */

export type TelemetryEventType = 'error' | 'web_vital' | 'api_error' | 'event';

export interface TelemetryEvent {
  type: TelemetryEventType;
  timestamp: string;
  name?: string;
  route?: string;
  traceId?: string;
  errorType?: string;
  message?: string;
  stack?: string;
  value?: number;
  rating?: string;
  statusCode?: number;
  method?: string;
  durationMs?: number;
  properties?: Record<string, string>;
}

/** Debe coincidir con TelemetryBatchRequestValidator del backend. */
const MAX_EVENTS_PER_BATCH = 50;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_STACK_LENGTH = 8000;
const MAX_PROPERTIES = 20;

/** Ventana de agrupación: se acumulan eventos y se envían juntos. */
const FLUSH_INTERVAL_MS = 5000;

/** Cota de la cola en memoria; si se llena se descartan los más viejos. */
const MAX_QUEUE_SIZE = 200;

const SESSION_STORAGE_KEY = 'tt_session_id';
const ANONYMOUS_STORAGE_KEY = 'tt_anonymous_id';

/** Claves que nunca deben salir del navegador (§17). */
const BLOCKED_KEY_FRAGMENTS = [
  'password', 'passwd', 'pwd',
  'token', 'jwt', 'bearer',
  'authorization', 'auth',
  'secret', 'apikey', 'api_key',
  'cookie', 'email', 'mail',
  'creditcard', 'card'
];

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/g;
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SECRET_KV_PATTERN = /\b(password|pwd|token|secret|apikey|api_key)\b\s*[=:]\s*[^\s&,;"']+/gi;
const BEARER_PATTERN = /bearer\s+[A-Za-z0-9._~+/-]+=*/gi;

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly router = inject(Router);

  private queue: TelemetryEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentRoute = 'unknown';
  private started = false;

  /** Si el muestreo excluye esta sesión, solo se envían errores. */
  private readonly sampled: boolean;

  readonly sessionId: string;
  readonly anonymousId: string;

  constructor() {
    this.sessionId = this.readOrCreate(sessionStorage, SESSION_STORAGE_KEY);
    this.anonymousId = this.readOrCreate(localStorage, ANONYMOUS_STORAGE_KEY);
    this.sampled = Math.random() < (environment.telemetry?.sampleRate ?? 1);
  }

  /** Arranca el seguimiento de ruta y el envío periódico. Idempotente. */
  start(): void {
    if (this.started || !this.isEnabled()) {
      return;
    }
    this.started = true;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Se guarda el template de ruta, no la URL con ids: si se enviara la URL
        // concreta la cardinalidad de las métricas sería ilimitada (§16).
        this.currentRoute = this.routeTemplate();
      }
    });

    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    // Al cerrar o esconder la pestaña se vacía la cola con sendBeacon, que el
    // navegador entrega aunque el documento ya se haya descargado.
    window.addEventListener('pagehide', () => this.flush(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });
  }

  /** Error de JavaScript o de renderizado. Los errores nunca se muestrean. */
  trackError(error: unknown, context?: Record<string, string>): void {
    const { name, message, stack } = this.describeError(error);
    this.enqueue({
      type: 'error',
      timestamp: new Date().toISOString(),
      route: this.currentRoute,
      errorType: name,
      message,
      stack,
      properties: this.scrubProperties(context)
    }, true);
  }

  /** Error de una llamada a la API, visto desde el navegador. */
  trackApiError(params: {
    method: string;
    url: string;
    statusCode: number;
    durationMs: number;
    message?: string;
    traceId?: string;
  }): void {
    this.enqueue({
      type: 'api_error',
      timestamp: new Date().toISOString(),
      route: this.currentRoute,
      method: params.method,
      statusCode: params.statusCode,
      durationMs: Math.round(params.durationMs),
      message: this.scrub(params.message)?.slice(0, MAX_MESSAGE_LENGTH),
      traceId: params.traceId,
      properties: { endpoint: this.endpointTemplate(params.url) }
    }, true);
  }

  /** Web Vital (LCP, INP, CLS, FCP, TTFB). */
  trackWebVital(name: string, value: number, rating?: string): void {
    this.enqueue({
      type: 'web_vital',
      timestamp: new Date().toISOString(),
      route: this.currentRoute,
      name,
      value,
      rating
    });
  }

  /** Evento de uso de una funcionalidad (§23). */
  trackEvent(name: string, properties?: Record<string, string>): void {
    this.enqueue({
      type: 'event',
      timestamp: new Date().toISOString(),
      route: this.currentRoute,
      name,
      properties: this.scrubProperties(properties)
    });
  }

  // --- Interno ---------------------------------------------------------------

  private isEnabled(): boolean {
    return environment.telemetry?.enabled === true;
  }

  private enqueue(event: TelemetryEvent, always = false): void {
    if (!this.isEnabled() || (!always && !this.sampled)) {
      return;
    }

    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.queue.shift();
    }
    this.queue.push(event);

    if (this.queue.length >= MAX_EVENTS_PER_BATCH) {
      this.flush();
    }
  }

  private flush(useBeacon = false): void {
    if (this.queue.length === 0) {
      return;
    }

    const events = this.queue.splice(0, MAX_EVENTS_PER_BATCH);
    const payload = JSON.stringify({
      application: 'timetracker-web',
      version: environment.appVersion,
      environment: environment.envName,
      sessionId: this.sessionId,
      anonymousId: this.anonymousId,
      events
    });

    const url = this.telemetryUrl();

    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        return;
      }

      // fetch con keepalive en lugar de HttpClient: así la telemetría no pasa por
      // el LoginInterceptor y no se generan bucles (un 401 de telemetría
      // dispararía un refresh, que a su vez podría reportar otro error).
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        },
        body: payload,
        keepalive: true
      }).catch(() => {
        // Silencio deliberado: la telemetría nunca debe molestar al usuario.
      });
    } catch {
      // idem
    }
  }

  private telemetryUrl(): string {
    const configured = environment.telemetry?.endpoint;
    if (configured) {
      return configured;
    }
    return `${environment.baseUrl.replace(/\/$/, '')}/telemetry`;
  }

  private routeTemplate(): string {
    let route = this.router.routerState.snapshot.root;
    const parts: string[] = [];

    while (route.firstChild) {
      route = route.firstChild;
      const path = route.routeConfig?.path;
      if (path) {
        parts.push(path);
      }
    }

    return parts.length > 0 ? '/' + parts.join('/') : '/';
  }

  /** Reemplaza los ids numéricos de la URL por {id} para acotar la cardinalidad. */
  private endpointTemplate(url: string): string {
    try {
      const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
      return path.replace(/\/\d+/g, '/{id}');
    } catch {
      return 'unknown';
    }
  }

  private describeError(error: unknown): { name: string; message: string; stack?: string } {
    if (error instanceof Error) {
      return {
        name: error.name || 'Error',
        message: (this.scrub(error.message) ?? '').slice(0, MAX_MESSAGE_LENGTH),
        stack: this.scrub(error.stack)?.slice(0, MAX_STACK_LENGTH)
      };
    }

    if (typeof error === 'string') {
      return { name: 'Error', message: (this.scrub(error) ?? '').slice(0, MAX_MESSAGE_LENGTH) };
    }

    let serialized: string;
    try {
      serialized = JSON.stringify(error);
    } catch {
      serialized = String(error);
    }

    return {
      name: 'UnknownError',
      message: (this.scrub(serialized) ?? '').slice(0, MAX_MESSAGE_LENGTH)
    };
  }

  private scrub(value: string | undefined | null): string | undefined {
    if (!value) {
      return undefined;
    }
    return value
      .replace(JWT_PATTERN, '[REDACTED]')
      .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
      .replace(SECRET_KV_PATTERN, '[REDACTED]')
      .replace(EMAIL_PATTERN, '[REDACTED]');
  }

  private scrubProperties(properties?: Record<string, string>): Record<string, string> | undefined {
    if (!properties) {
      return undefined;
    }

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (Object.keys(result).length >= MAX_PROPERTIES) {
        break;
      }
      if (BLOCKED_KEY_FRAGMENTS.some(fragment => key.toLowerCase().includes(fragment))) {
        continue;
      }
      result[key] = this.scrub(String(value)) ?? '';
    }
    return result;
  }

  private readOrCreate(storage: Storage, key: string): string {
    try {
      const existing = storage.getItem(key);
      if (existing) {
        return existing;
      }
      const created = this.uuid();
      storage.setItem(key, created);
      return created;
    } catch {
      // Modo privado o almacenamiento bloqueado: el id vive solo en memoria.
      return this.uuid();
    }
  }

  private uuid(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

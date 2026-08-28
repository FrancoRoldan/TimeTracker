import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TelemetryService } from './telemetry.service';

/**
 * Manejador global de errores de Angular (§15.1 del plan, hallazgo A11).
 *
 * Antes de esto ningún error del navegador salía del navegador: `main.ts` solo hacía
 * `.catch(err => console.error(err))` sobre el bootstrap, y los ~80 `console.*`
 * repartidos por la aplicación morían en la consola del usuario.
 *
 * Captura errores de renderizado, de código asíncrono y de carga de chunks. Los
 * errores HTTP los reporta el interceptor con su contexto de método, status y
 * duración, así que aquí se ignoran para no contarlos dos veces.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly telemetry = inject(TelemetryService);

  handleError(error: unknown): void {
    // Los HttpErrorResponse ya los reporta el LoginInterceptor como api_error.
    if (error instanceof HttpErrorResponse) {
      return;
    }

    try {
      this.telemetry.trackError(error, {
        errorSource: this.classify(error)
      });
    } catch {
      // El manejador de errores jamás puede lanzar.
    }

    // Se mantiene la salida por consola: sigue siendo útil durante el desarrollo.
    console.error(error);
  }

  /**
   * Los errores de carga de chunk merecen distinguirse: normalmente significan que
   * el usuario tiene abierta una versión del bundle que ya no está desplegada, y se
   * resuelven recargando, no depurando.
   */
  private classify(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);

    if (/ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module/i.test(message)) {
      return 'chunk_load';
    }
    if (error instanceof Error && error.name === 'TypeError') {
      return 'type_error';
    }
    return 'runtime';
  }
}

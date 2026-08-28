import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { TelemetryService } from './telemetry.service';

/**
 * Reporte de Web Vitals (§15.3 y §16 del plan de observabilidad).
 *
 * Son las métricas que solo se pueden medir desde el dispositivo real del usuario:
 * un servidor rápido puede convivir con un LCP malo en móviles.
 *
 *   LCP   Largest Contentful Paint  — cuándo aparece el contenido principal
 *   INP   Interaction to Next Paint — cuán reactiva se siente la interfaz
 *   CLS   Cumulative Layout Shift   — cuánto "salta" el layout
 *   FCP   First Contentful Paint
 *   TTFB  Time To First Byte
 *
 * Las cinco se reportan una sola vez por carga, cuando el valor queda firme.
 */
export function registerWebVitals(telemetry: TelemetryService): void {
  const report = (metric: Metric) => {
    // CLS no tiene unidad de tiempo; el resto son milisegundos. Se envía el valor
    // crudo y la dimensión vital.name permite separarlos en el dashboard.
    telemetry.trackWebVital(metric.name, metric.value, metric.rating);
  };

  try {
    onLCP(report);
    onINP(report);
    onCLS(report);
    onFCP(report);
    onTTFB(report);
  } catch {
    // Navegador sin soporte: no es un error que valga la pena reportar.
  }
}

/**
 * Generación de contexto de traza W3C para propagar desde el navegador (§7 del plan).
 *
 * Sin esto las trazas empiezan en la API y no se puede seguir una operación desde el
 * clic del usuario. Con la cabecera `traceparent`, la instrumentación de ASP.NET Core
 * adopta el traceId del navegador y el span del backend queda colgando del mismo árbol.
 *
 * Formato: version-traceid-spanid-flags
 *   00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 */

export interface TraceContext {
  /** 32 caracteres hex. Es el id por el que se busca en Tempo. */
  traceId: string;
  /** 16 caracteres hex. */
  spanId: string;
  /** Valor listo para la cabecera `traceparent`. */
  header: string;
}

/** `01` = sampled. Se muestrea del lado del backend, no acá. */
const SAMPLED_FLAG = '01';

export function createTraceContext(): TraceContext {
  const traceId = randomHex(32);
  const spanId = randomHex(16);

  return {
    traceId,
    spanId,
    header: `00-${traceId}-${spanId}-${SAMPLED_FLAG}`
  };
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length / 2);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

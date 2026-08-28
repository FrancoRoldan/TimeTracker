namespace Data.Dtos.Telemetry
{
    /// <summary>
    /// Lote de eventos de telemetría enviado por el frontend (§17 y §18 del plan).
    ///
    /// El endpoint es público —lo consume el navegador—, así que este contrato es
    /// deliberadamente cerrado: tipos acotados, longitudes máximas y un diccionario
    /// de propiedades limitado. Todo lo que no encaje se rechaza o se recorta.
    /// </summary>
    public class TelemetryBatchRequest
    {
        /// <summary>Aplicación emisora. Hoy solo se acepta "timetracker-web".</summary>
        public string Application { get; set; } = string.Empty;

        /// <summary>Versión del bundle desplegado.</summary>
        public string? Version { get; set; }

        /// <summary>Entorno declarado por el cliente (informativo, no se confía en él).</summary>
        public string? Environment { get; set; }

        /// <summary>Identificador de sesión de navegación. No es un identificador de usuario.</summary>
        public string? SessionId { get; set; }

        /// <summary>Identificador anónimo persistente. Nunca se usa para autorización (§19).</summary>
        public string? AnonymousId { get; set; }

        public List<TelemetryEventRequest> Events { get; set; } = new();
    }

    public class TelemetryEventRequest
    {
        /// <summary>error | web_vital | api_error | event</summary>
        public string Type { get; set; } = string.Empty;

        public DateTimeOffset? Timestamp { get; set; }

        /// <summary>Nombre del evento o de la métrica (por ejemplo "LCP", "chunk_load_error").</summary>
        public string? Name { get; set; }

        /// <summary>Ruta de Angular. Debe ser el template, no la URL con ids.</summary>
        public string? Route { get; set; }

        /// <summary>TraceId de W3C generado en el navegador, para correlacionar con la API.</summary>
        public string? TraceId { get; set; }

        // --- Errores ---
        public string? ErrorType { get; set; }
        public string? Message { get; set; }
        public string? Stack { get; set; }

        // --- Web Vitals y métricas ---
        public double? Value { get; set; }
        public string? Rating { get; set; }

        // --- Errores de API ---
        public int? StatusCode { get; set; }
        public string? Method { get; set; }
        public double? DurationMs { get; set; }

        /// <summary>Dimensiones adicionales de baja cardinalidad.</summary>
        public Dictionary<string, string>? Properties { get; set; }
    }
}

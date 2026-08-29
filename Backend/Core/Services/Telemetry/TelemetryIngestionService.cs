using Core.Common;
using Core.Observability;
using Data.Dtos.Telemetry;
using Data.Validators;
using FluentValidation;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Core.Services.Telemetry
{
    public interface ITelemetryIngestionService
    {
        Task<Result<int>> IngestAsync(TelemetryBatchRequest request);
    }

    /// <summary>
    /// Recibe la telemetría del navegador, la sanea y la publica en las mismas señales
    /// que el resto del sistema (§15–§18 del plan).
    ///
    /// Los eventos no se almacenan en la base: se emiten como logs estructurados
    /// —que Promtail/Alloy recogen de stdout hacia Loki— y como métricas OTLP. Así el
    /// frontend queda en los mismos dashboards que el backend sin infraestructura extra.
    /// </summary>
    public class TelemetryIngestionService : ITelemetryIngestionService
    {
        private readonly IValidator<TelemetryBatchRequest> _validator;
        private readonly ILogger<TelemetryIngestionService> _logger;

        public TelemetryIngestionService(
            IValidator<TelemetryBatchRequest> validator,
            ILogger<TelemetryIngestionService> logger)
        {
            _validator = validator;
            _logger = logger;
        }

        public async Task<Result<int>> IngestAsync(TelemetryBatchRequest request)
        {
            var validation = await _validator.ValidateAsync(request);
            if (!validation.IsValid)
            {
                return Result<int>.Failure(
                    validation.Errors.Select(e => e.ErrorMessage).ToList());
            }

            var version = Truncate(request.Version, TelemetryBatchRequestValidator.MaxShortFieldLength)
                ?? "unknown";
            var sessionId = Truncate(request.SessionId, TelemetryBatchRequestValidator.MaxShortFieldLength);
            var anonymousId = Truncate(request.AnonymousId, TelemetryBatchRequestValidator.MaxShortFieldLength);

            foreach (var evt in request.Events)
            {
                Process(evt, version, sessionId, anonymousId);
            }

            return Result<int>.Success(request.Events.Count);
        }

        private void Process(
            TelemetryEventRequest evt,
            string version,
            string? sessionId,
            string? anonymousId)
        {
            var route = TelemetrySanitizer.Scrub(evt.Route) ?? "unknown";
            var properties = TelemetrySanitizer.ScrubProperties(
                evt.Properties, TelemetryBatchRequestValidator.MaxPropertiesPerEvent);

            // Dimensiones comunes. `service.name` identifica al frontend para que sus
            // señales convivan con las de la API sin mezclarse.
            var tags = new KeyValuePair<string, object?>[]
            {
                new("service.name", "timetracker-web"),
                new("service.version", version),
                new("route", route)
            };

            switch (evt.Type)
            {
                case "error":
                    TimeTrackerTelemetry.FrontendErrors.Add(1, tags);
                    _logger.LogError(
                        "Error de frontend {ErrorType} en {Route}: {ErrorMessage} " +
                        "[app=timetracker-web version={AppVersion} session={SessionId} " +
                        "anon={AnonymousId} browserTraceId={BrowserTraceId}]{Stack}",
                        evt.ErrorType ?? "Error",
                        route,
                        TelemetrySanitizer.Scrub(evt.Message),
                        version, sessionId, anonymousId, evt.TraceId,
                        FormatStack(evt.Stack));
                    break;

                case "api_error":
                    TimeTrackerTelemetry.FrontendApiErrors.Add(1, tags.Append(
                        new KeyValuePair<string, object?>("http.status_code", evt.StatusCode)).ToArray());
                    _logger.LogWarning(
                        "Error de API visto por el navegador: {Method} {Route} respondió " +
                        "{StatusCode} en {DurationMs} ms " +
                        "[app=timetracker-web version={AppVersion} session={SessionId} " +
                        "browserTraceId={BrowserTraceId}] {ErrorMessage}",
                        evt.Method, route, evt.StatusCode, evt.DurationMs,
                        version, sessionId, evt.TraceId,
                        TelemetrySanitizer.Scrub(evt.Message));
                    break;

                case "web_vital":
                    if (evt.Value.HasValue && !string.IsNullOrEmpty(evt.Name))
                    {
                        TimeTrackerTelemetry.WebVital.Record(evt.Value.Value, tags.Append(
                            new KeyValuePair<string, object?>("vital.name", evt.Name)).ToArray());
                    }
                    break;

                case "event":
                    if (!string.IsNullOrEmpty(evt.Name))
                    {
                        TimeTrackerTelemetry.FrontendEvents.Add(1, tags.Append(
                            new KeyValuePair<string, object?>("event.name", evt.Name)).ToArray());

                        // Además de contarlo, se deja el rastro consultable: la métrica
                        // dice CUÁNTOS, el log dice QUIÉN y EN QUÉ ORDEN. Es lo que
                        // permite reconstruir qué venía haciendo el usuario antes de
                        // un error, filtrando por sessionId en Loki (§23).
                        _logger.LogInformation(
                            "Evento de uso {EventName} en {Route} " +
                            "[app=timetracker-web version={AppVersion} session={SessionId} " +
                            "anon={AnonymousId} browserTraceId={BrowserTraceId}] {EventProperties}",
                            evt.Name, route,
                            version, sessionId, anonymousId, evt.TraceId,
                            properties.Count > 0 ? JsonSerializer.Serialize(properties) : "{}");
                    }
                    break;
            }
        }

        /// <summary>El stack va como bloque aparte para no romper la línea del mensaje.</summary>
        private static string FormatStack(string? stack)
        {
            var scrubbed = TelemetrySanitizer.Scrub(stack);
            return string.IsNullOrWhiteSpace(scrubbed) ? string.Empty : "\n" + scrubbed;
        }

        private static string? Truncate(string? value, int max) =>
            string.IsNullOrEmpty(value) || value.Length <= max ? value : value[..max];
    }
}

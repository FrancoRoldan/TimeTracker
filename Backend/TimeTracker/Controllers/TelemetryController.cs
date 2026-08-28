using Core.Services.Telemetry;
using Data.Dtos.Telemetry;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TimeTracker.Extensions;
using TimeTracker.Observability;

namespace TimeTracker.Controllers
{
    /// <summary>
    /// Endpoint de telemetría del frontend (§18 del plan).
    ///
    /// Es público a propósito: lo consume el navegador, también antes de que el usuario
    /// se autentique. Por eso lleva controles propios: rate limiting, límite de tamaño
    /// de payload, validación de esquema y saneado de PII en el servidor.
    ///
    /// Nunca debe bloquear una operación funcional del usuario: siempre responde
    /// rápido y nunca propaga un error al cliente por un fallo de ingestión.
    /// </summary>
    [Route("api/telemetry")]
    [ApiController]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Telemetry)]
    public class TelemetryController : ControllerBase
    {
        /// <summary>Límite de cuerpo: 128 KB por lote.</summary>
        public const int MaxPayloadBytes = 128 * 1024;

        private readonly ITelemetryIngestionService _telemetryService;

        public TelemetryController(ITelemetryIngestionService telemetryService)
        {
            _telemetryService = telemetryService;
        }

        [HttpPost]
        [RequestSizeLimit(MaxPayloadBytes)]
        [Consumes("application/json")]
        public async Task<IActionResult> Ingest([FromBody] TelemetryBatchRequest request)
        {
            var result = await _telemetryService.IngestAsync(request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            // 202: se aceptó el lote; el cliente no espera ningún procesamiento.
            return Accepted(new { accepted = result.Value });
        }
    }
}

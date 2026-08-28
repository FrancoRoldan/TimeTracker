using Core.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Core.Observability;
using TimeTracker.Observability;
using System.Diagnostics;
using System.Text.Json;

namespace TimeTracker.Middleware
{
    /// <summary>
    /// Punto único de manejo de excepciones no controladas.
    ///
    /// Reemplaza los ~48 bloques try/catch duplicados que había en los controllers.
    /// Devuelve siempre ProblemDetails con el <c>traceId</c> de la request, de modo que
    /// el error que ve el usuario pueda correlacionarse con el log y con el trace.
    ///
    /// Mantiene además la propiedad <c>error</c> en el cuerpo porque es la que consume
    /// <c>extractErrorMessage()</c> en el frontend Angular.
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (TenantAccessDeniedException ex)
            {
                // Intento de acceso a una empresa ajena: es un 403, no un error del servidor.
                _logger.LogWarning(
                    "Acceso denegado al tenant {RequestedCompanyId} para el usuario {UserId} en {Method} {Path}",
                    ex.RequestedCompanyId,
                    context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
                    context.Request.Method,
                    context.Request.Path);

                // Alimenta la alerta de "tasa de 403 anómala" de §27.
                TimeTrackerTelemetry.TenantAccessDenied.Add(1);

                await WriteProblemAsync(
                    context,
                    StatusCodes.Status403Forbidden,
                    "Forbidden",
                    "No tiene acceso a la empresa solicitada.");
            }
            catch (FluentValidation.ValidationException ex)
            {
                _logger.LogWarning(ex, "Validación fallida en {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                await WriteProblemAsync(
                    context,
                    StatusCodes.Status400BadRequest,
                    "Bad Request",
                    ex.Message);
            }
            catch (System.ComponentModel.DataAnnotations.ValidationException ex)
            {
                _logger.LogWarning(ex, "Validación fallida en {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                await WriteProblemAsync(
                    context,
                    StatusCodes.Status400BadRequest,
                    "Bad Request",
                    ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Acceso no autorizado en {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                await WriteProblemAsync(
                    context,
                    StatusCodes.Status403Forbidden,
                    "Forbidden",
                    "No tiene permisos para realizar esta acción.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error no controlado en {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                // El detalle interno solo se expone fuera de producción.
                var detail = _environment.IsDevelopment()
                    ? ex.Message
                    : "Internal server error";

                await WriteProblemAsync(
                    context,
                    StatusCodes.Status500InternalServerError,
                    "Internal Server Error",
                    detail);
            }
        }

        private static async Task WriteProblemAsync(
            HttpContext context,
            int statusCode,
            string title,
            string detail)
        {
            // Si la respuesta ya empezó a escribirse no se puede reemplazar el cuerpo.
            if (context.Response.HasStarted)
                return;

            // El TraceId (sin el spanId) es el identificador por el que se busca en Tempo.
            var traceId = Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;

            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Instance = context.Request.Path
            };
            problem.Extensions["traceId"] = traceId;
            // Compatibilidad con extractErrorMessage() del frontend.
            problem.Extensions["error"] = detail;

            context.Response.Clear();
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/problem+json";

            await context.Response.WriteAsync(JsonSerializer.Serialize(problem, JsonOptions));
        }

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public static class ExceptionHandlingMiddlewareExtensions
    {
        public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder app)
            => app.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}

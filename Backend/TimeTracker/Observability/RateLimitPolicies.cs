using Microsoft.AspNetCore.RateLimiting;
using System.Text.Json;
using System.Threading.RateLimiting;

namespace TimeTracker.Observability
{
    /// <summary>
    /// Rate limiting del endpoint público de telemetría (§18).
    ///
    /// Se particiona por sessionId cuando el cliente lo envía y por IP en caso
    /// contrario, para que una pestaña ruidosa no consuma la cuota de toda una red
    /// corporativa detrás de un mismo NAT.
    /// </summary>
    public static class RateLimitPolicies
    {
        public const string Telemetry = "telemetry";

        /// <summary>Lotes admitidos por ventana y por partición.</summary>
        public const int PermitLimit = 60;

        /// <summary>Duración de la ventana.</summary>
        public static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

        public static IServiceCollection AddTelemetryRateLimiting(this IServiceCollection services)
        {
            services.AddRateLimiter(options =>
            {
                options.AddPolicy(Telemetry, httpContext =>
                {
                    var sessionId = httpContext.Request.Headers["X-Session-Id"].FirstOrDefault();
                    var partition = !string.IsNullOrWhiteSpace(sessionId)
                        ? $"session:{sessionId}"
                        : $"ip:{httpContext.Connection.RemoteIpAddress}";

                    return RateLimitPartition.GetFixedWindowLimiter(partition, _ =>
                        new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = PermitLimit,
                            Window = Window,
                            QueueLimit = 0 // no encolar: descartar es preferible a demorar
                        });
                });

                options.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    context.HttpContext.Response.ContentType = "application/problem+json";

                    await context.HttpContext.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        title = "Too Many Requests",
                        status = StatusCodes.Status429TooManyRequests,
                        error = "Telemetry rate limit exceeded"
                    }), cancellationToken);
                };
            });

            return services;
        }
    }
}

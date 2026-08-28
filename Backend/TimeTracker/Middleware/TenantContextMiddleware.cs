using Core.Common.Exceptions;
using Core.Services.Tenant;
using System.Diagnostics;
using System.Security.Claims;

namespace TimeTracker.Middleware
{
    /// <summary>
    /// Resuelve el contexto de tenant/usuario una sola vez por request y lo publica en
    /// las tres señales: lo agrega al scope de logging, a los atributos del span y —vía
    /// el ActivityEnrichment— a la traza que se exporta.
    ///
    /// Resuelve el hueco descrito en §7 del plan: hasta ahora el contexto vivía
    /// únicamente dentro de ITenantService, resuelto on-demand en cada llamada de
    /// servicio, y no llegaba a ningún log ni span.
    /// </summary>
    public class TenantContextMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TenantContextMiddleware> _logger;

        public TenantContextMiddleware(RequestDelegate next, ILogger<TenantContextMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                await _next(context);
                return;
            }

            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = context.User.FindFirst(ClaimTypes.Role)?.Value
                ?? context.User.FindFirst("Role")?.Value;

            // GetTenantId lanza TenantAccessDeniedException si el X-Company-Id no
            // pertenece al usuario. Se deja propagar: el ExceptionHandlingMiddleware
            // la traduce a 403 y registra la métrica de seguridad.
            var tenantId = tenantService.GetTenantId();

            var activity = Activity.Current;
            if (activity is not null)
            {
                if (tenantId.HasValue)
                    activity.SetTag("tenant.id", tenantId.Value);
                if (!string.IsNullOrEmpty(userId))
                    activity.SetTag("user.id", userId);
                if (!string.IsNullOrEmpty(role))
                    activity.SetTag("user.role", role);
            }

            var scope = new Dictionary<string, object>
            {
                ["tenant.id"] = tenantId?.ToString() ?? "none",
                ["user.id"] = userId ?? "anonymous"
            };
            if (!string.IsNullOrEmpty(role))
                scope["user.role"] = role;

            using (_logger.BeginScope(scope))
            {
                await _next(context);
            }
        }
    }

    public static class TenantContextMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantContext(this IApplicationBuilder app)
            => app.UseMiddleware<TenantContextMiddleware>();
    }
}

using Core.Common.Exceptions;
using Data.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Core.Services.Tenant
{
    /// <summary>
    /// Resuelve el tenant y el usuario de la request actual.
    ///
    /// Implementa además <see cref="ICurrentUserAccessor"/> para que la capa de datos
    /// pueda estampar CreatedBy/UpdatedBy sin depender de Core.
    /// </summary>
    public class TenantService : ITenantService, ICurrentUserAccessor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? GetTenantId()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated != true)
                return null;

            // Get company ID from request header (X-Company-Id)
            var companyIdHeader = httpContext.Request.Headers["X-Company-Id"].FirstOrDefault();

            // Get list of allowed company IDs from JWT token
            var companyIdsClaimValue = httpContext.User.FindFirst("CompanyIds")?.Value;

            // If no CompanyIds claim exists, fall back to old behavior (for backward compatibility)
            if (string.IsNullOrEmpty(companyIdsClaimValue))
            {
                var companyIdClaim = httpContext.User.FindFirst("CompanyId");
                return companyIdClaim != null ? int.Parse(companyIdClaim.Value) : null;
            }

            // Parse allowed company IDs from JWT
            var allowedCompanyIds = companyIdsClaimValue
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(int.Parse)
                .ToList();

            // If no header provided, use the default CompanyId from JWT
            if (string.IsNullOrEmpty(companyIdHeader))
            {
                var defaultCompanyIdClaim = httpContext.User.FindFirst("CompanyId");
                return defaultCompanyIdClaim != null ? int.Parse(defaultCompanyIdClaim.Value) : null;
            }

            // Validate that the requested company ID is in the user's allowed list
            if (int.TryParse(companyIdHeader, out int requestedCompanyId))
            {
                if (allowedCompanyIds.Contains(requestedCompanyId))
                {
                    return requestedCompanyId;
                }

                // User is trying to access a company they don't belong to.
                // Excepción tipada: el middleware la traduce a HTTP 403, no a 500.
                throw new TenantAccessDeniedException(requestedCompanyId);
            }

            // If header is invalid, return null
            return null;
        }

        public int? GetCurrentUserId()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated != true)
                return null;

            var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : null;
        }

        public string GetCurrentUserEmail()
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value
                ?? string.Empty;
        }

        // ---- ICurrentUserAccessor ----------------------------------------------------
        // Nunca deben lanzar: se invocan durante SaveChanges, donde una excepción
        // enmascararía el error real de la operación de negocio.

        int? ICurrentUserAccessor.GetUserId()
        {
            try
            {
                return GetCurrentUserId();
            }
            catch
            {
                return null;
            }
        }

        int? ICurrentUserAccessor.GetTenantId()
        {
            try
            {
                return GetTenantId();
            }
            catch (TenantAccessDeniedException)
            {
                // La request ya será rechazada con 403 por el middleware;
                // aquí solo significa que no hay tenant válido para estampar.
                return null;
            }
            catch
            {
                return null;
            }
        }

        string? ICurrentUserAccessor.GetIpAddress()
        {
            try
            {
                var context = _httpContextAccessor.HttpContext;
                if (context is null)
                    return null;

                // Detrás de un proxy o del contenedor de Nginx, la IP real del cliente
                // llega en X-Forwarded-For; se toma la primera de la lista.
                var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(forwarded))
                    return forwarded.Split(',')[0].Trim();

                return context.Connection.RemoteIpAddress?.ToString();
            }
            catch
            {
                return null;
            }
        }
    }
}

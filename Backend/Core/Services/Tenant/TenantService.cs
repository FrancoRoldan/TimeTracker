using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Core.Services.Tenant
{
    public class TenantService : ITenantService
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
                else
                {
                    // User is trying to access a company they don't belong to
                    throw new UnauthorizedAccessException($"User does not have access to company {requestedCompanyId}");
                }
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
    }
}

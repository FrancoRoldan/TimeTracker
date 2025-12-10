using Data.Enums;
using Data.Models;
using System.Security.Claims;

namespace Core.Security
{
    public interface IJwtService
    {
        string GenerateToken(User user, List<int> companyIds, int defaultCompanyId, UserRole role);
        ClaimsPrincipal ValidateToken(string token, bool validateLifetime = true);
        string RefreshToken(string token);
        User getUserFromToken(string token);
        string ExtractTokenFromHeader(string authorizationHeader);
    }
}

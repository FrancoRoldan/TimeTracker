using Data.Enums;
using Data.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Core.Security
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user, List<int> companyIds, int defaultCompanyId, UserRole role)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Serialize company IDs as comma-separated string
            var companyIdsString = string.Join(",", companyIds);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("CompanyId", defaultCompanyId.ToString()), // Keep for backward compatibility
                new Claim("CompanyIds", companyIdsString), // List of all companies
                new Claim(ClaimTypes.Role, role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(3),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal ValidateToken(string token, bool validateLifetime = true)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = validateLifetime,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidAudience = _configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(key)
            };

            return tokenHandler.ValidateToken(token, tokenValidationParameters, out _);
        }

        public string RefreshToken(string token)
        {
            try
            {
                ClaimsPrincipal principal = ValidateToken(token, validateLifetime: false);
                string userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
                string email = principal.FindFirst(ClaimTypes.Email)?.Value ?? "";
                string companyIdStr = principal.FindFirst("CompanyId")?.Value ?? "0";
                string companyIdsStr = principal.FindFirst("CompanyIds")?.Value ?? "";
                string roleStr = principal.FindFirst(ClaimTypes.Role)?.Value ?? "Developer";

                var user = new User { Id = int.Parse(userId), Email = email };
                var companyId = int.Parse(companyIdStr);

                // Parse company IDs from comma-separated string
                var companyIds = string.IsNullOrEmpty(companyIdsStr)
                    ? new List<int> { companyId }
                    : companyIdsStr.Split(',').Select(int.Parse).ToList();

                var role = Enum.Parse<Data.Enums.UserRole>(roleStr);

                return GenerateToken(user, companyIds, companyId, role);
            }
            catch (SecurityTokenException)
            {
                return "";
            }
        }

        public User getUserFromToken(string token) {
            ClaimsPrincipal principal = ValidateToken(token, validateLifetime: false);

            string userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
            string email = principal.FindFirst(ClaimTypes.Email)?.Value ?? "";

            var user = new User { Id = int.Parse(userId), Email = email };
            return user;
        }

        public string ExtractTokenFromHeader(string authorizationHeader)
        {
            if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return "";
            }
            return authorizationHeader.Substring("Bearer ".Length).Trim();
        }
    }
}

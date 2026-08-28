using Core.Observability;
using Core.Security;
using Core.Services;
using Core.Services.Companies;
using Data.Dtos.Auth;
using Microsoft.AspNetCore.Mvc;
using TimeTracker.Extensions;
using System.ComponentModel.DataAnnotations;

namespace TimeTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class authController : ControllerBase
    {
        private readonly ILogger<authController> _logger;
        private readonly IUserService _userService;
        private readonly IJwtService _jwtService;
        private readonly ICompanyService _companyService;

        public authController(
            ILogger<authController> logger,
            IUserService userService,
            IJwtService jwtService,
            ICompanyService companyService)
        {
            _logger = logger;
            _userService = userService;
            _jwtService = jwtService;
            _companyService = companyService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserRequest request)
        {
            var result = await _companyService.RegisterUserAsync(request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            TimeTrackerTelemetry.UsersRegistered.Add(1);

            // After successful registration, authenticate the user to generate token
            var (user, companies) = await _userService.AuthenticateAsync(result.Value.Email, request.Password);

            if (user == null)
                return StatusCode(500, new { error = "Failed to authenticate after registration" });

            var selectedCompany = companies.First();
            var companyIds = companies.Select(c => c.CompanyId).ToList();
            var token = _jwtService.GenerateToken(user, companyIds, selectedCompany.CompanyId, selectedCompany.Role);

            var response = new Data.Dtos.Auth.LoginResponse
            {
                Token = token,
                User = new Data.Dtos.Auth.UserInfo
                {
                    Id = user.Id,
                    Name = user.Nombre,
                    Email = user.Email
                },
                Companies = companies.Select(c => new Data.Dtos.Auth.UserCompanyInfo
                {
                    CompanyId = c.CompanyId,
                    CompanyName = c.Company.Name,
                    CompanyCode = c.Company.Code,
                    Role = c.Role.ToString()
                }).ToList(),
                SelectedCompanyId = selectedCompany.CompanyId
            };

            return StatusCode(201, response);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Data.Dtos.Auth.LoginRequest model)
        {
            var (user, companies) = await _userService.AuthenticateAsync(model.Email, model.Password);

            if (user == null)
            {
                // No se registra el email: alimenta la alerta de §27 sin almacenar PII.
                TimeTrackerTelemetry.LoginFailed.Add(1);
                _logger.LogWarning("Intento de inicio de sesión fallido");
                return Unauthorized(new { error = "Invalid credentials" });
            }

            // If user belongs to multiple companies and didn't select one
            //if (companies.Count > 1 && !model.CompanyId.HasValue)
            //{
            //    var companiesInfo = companies.Select(c => new Data.Dtos.Auth.UserCompanyInfo
            //    {
            //        CompanyId = c.CompanyId,
            //        CompanyName = c.Company.Name,
            //        CompanyCode = c.Company.Code,
            //        Role = c.Role.ToString()
            //    }).ToList();

            //    return Ok(new
            //    {
            //        requireCompanySelection = true,
            //        companies = companiesInfo
            //    });
            //}

            // Use selected company or default to first
            var selectedCompany = model.CompanyId.HasValue
                ? companies.FirstOrDefault(c => c.CompanyId == model.CompanyId.Value)
                : companies.First();

            if (selectedCompany == null)
                return BadRequest(new { error = "Invalid company selection" });

            var companyIds = companies.Select(c => c.CompanyId).ToList();
            var token = _jwtService.GenerateToken(user, companyIds, selectedCompany.CompanyId, selectedCompany.Role);

            var response = new Data.Dtos.Auth.LoginResponse
            {
                Token = token,
                User = new Data.Dtos.Auth.UserInfo
                {
                    Id = user.Id,
                    Name = user.Nombre,
                    Email = user.Email
                },
                Companies = companies.Select(c => new Data.Dtos.Auth.UserCompanyInfo
                {
                    CompanyId = c.CompanyId,
                    CompanyName = c.Company.Name,
                    CompanyCode = c.Company.Code,
                    Role = c.Role.ToString()
                }).ToList(),
                SelectedCompanyId = selectedCompany.CompanyId
            };

            TimeTrackerTelemetry.UsersLoggedIn.Add(
                1, TimeTrackerTelemetry.TenantTag(selectedCompany.CompanyId));

            return Ok(response);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken()
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            string? token = _jwtService.ExtractTokenFromHeader(authHeader ?? "");

            if (string.IsNullOrEmpty(token))
                return Unauthorized();

            // Get user from token
            var user = _jwtService.getUserFromToken(token);
            if (user == null)
                return Unauthorized();

            // Get current companies from database (this will include any newly created companies)
            var companies = await _userService.GetUserCompaniesAsync(user.Id);

            if (companies == null || companies.Count == 0)
                return Unauthorized(new { error = "User has no associated companies" });

            // Use the first company as default (or keep the one from the old token if it still exists)
            var oldPrincipal = _jwtService.ValidateToken(token, validateLifetime: false);
            var oldCompanyIdStr = oldPrincipal.FindFirst("CompanyId")?.Value;
            var oldCompanyId = string.IsNullOrEmpty(oldCompanyIdStr) ? 0 : int.Parse(oldCompanyIdStr);

            var selectedCompany = companies.FirstOrDefault(c => c.CompanyId == oldCompanyId) ?? companies.First();
            var companyIds = companies.Select(c => c.CompanyId).ToList();

            // Generate new token with updated company list
            string newToken = _jwtService.GenerateToken(user, companyIds, selectedCompany.CompanyId, selectedCompany.Role);

            if (string.IsNullOrEmpty(newToken))
                return Unauthorized();

            return Ok(new { token = newToken });

        }
    }
}

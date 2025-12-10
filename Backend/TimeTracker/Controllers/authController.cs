using Core.Security;
using Core.Services;
using Core.Services.Companies;
using Data.Dtos.Auth;
using Microsoft.AspNetCore.Mvc;
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
            try
            {
                var result = await _companyService.RegisterUserAsync(request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return StatusCode(201, result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Data.Dtos.Auth.LoginRequest model)
        {
            try
            {
                var (user, companies) = await _userService.AuthenticateAsync(model.Email, model.Password);

                if (user == null)
                    return Unauthorized(new { error = "Invalid credentials" });

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

                return Ok(response);
            }
            catch (ValidationException ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login error");
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Internal server error" });
            }
        }

        [HttpPost("refresh")]
        public IActionResult RefreshToken()
        {
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                string? token = _jwtService.ExtractTokenFromHeader(authHeader ?? "");

                if (string.IsNullOrEmpty(token))
                    return Unauthorized();

                string newToken = _jwtService.RefreshToken(token);

                if (string.IsNullOrEmpty(newToken))
                    return Unauthorized();

                return Ok(new { token = newToken });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
            
        }
    }
}

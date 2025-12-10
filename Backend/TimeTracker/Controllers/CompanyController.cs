using Core.Services.Companies;
using Data.Dtos.Company;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TimeTracker.Controllers
{
    [Route("api/company")]
    [ApiController]
    [Authorize]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        private readonly ILogger<CompanyController> _logger;

        public CompanyController(ICompanyService companyService, ILogger<CompanyController> logger)
        {
            _companyService = companyService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest request)
        {
            try
            {
                var result = await _companyService.CreateCompanyAsync(request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return CreatedAtAction(nameof(GetCompanyById), new { id = result.Value!.Id }, result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating company");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompanyById(int id)
        {
            try
            {
                var result = await _companyService.GetCompanyByIdAsync(id);

                if (!result.IsSuccess)
                    return NotFound(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting company");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCompanies()
        {
            try
            {
                var result = await _companyService.GetAllCompaniesAsync();

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting companies");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("{id}/users")]
        public async Task<IActionResult> GetCompanyUsers(int id)
        {
            try
            {
                var result = await _companyService.GetCompanyUsersAsync(id);

                if (!result.IsSuccess)
                    return NotFound(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting company users");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("{id}/users")]
        public async Task<IActionResult> AddUserToCompany(int id, [FromBody] AddUserToCompanyRequest request)
        {
            try
            {
                var result = await _companyService.AddUserToCompanyAsync(id, request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(new { message = "User added to company successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding user to company");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpDelete("{companyId}/users/{userId}")]
        public async Task<IActionResult> RemoveUserFromCompany(int companyId, int userId)
        {
            try
            {
                var result = await _companyService.RemoveUserFromCompanyAsync(companyId, userId);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(new { message = "User removed from company successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user from company");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("join")]
        public async Task<IActionResult> JoinCompany([FromBody] JoinCompanyRequest request)
        {
            try
            {
                var result = await _companyService.JoinCompanyAsync(request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining company");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] UpdateCompanyRequest request)
        {
            try
            {
                var result = await _companyService.UpdateCompanyAsync(id, request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating company");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            try
            {
                var result = await _companyService.DeleteCompanyAsync(id);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(new { message = "Company deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting company");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("{companyId}/users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserInCompany(int companyId, int userId, [FromBody] UpdateUserInCompanyRequest request)
        {
            try
            {
                var result = await _companyService.UpdateUserInCompanyAsync(companyId, userId, request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return Ok(new { message = "User updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user in company");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}

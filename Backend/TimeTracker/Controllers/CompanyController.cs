using Core.Services.Companies;
using Data.Dtos.Company;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeTracker.Extensions;

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
            var result = await _companyService.CreateCompanyAsync(request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return CreatedAtAction(nameof(GetCompanyById), new { id = result.Value!.Id }, result.Value);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompanyById(int id)
        {
            var result = await _companyService.GetCompanyByIdAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCompanies()
        {
            var result = await _companyService.GetAllCompaniesAsync();

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("{id}/users")]
        public async Task<IActionResult> GetCompanyUsers(int id)
        {
            var result = await _companyService.GetCompanyUsersAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("{id}/users/available")]
        public async Task<IActionResult> GetAvailableUsers(int id)
        {
            var result = await _companyService.GetAvailableUsersAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPost("{id}/users")]
        public async Task<IActionResult> AddUserToCompany(int id, [FromBody] AddUserToCompanyRequest request)
        {
            var result = await _companyService.AddUserToCompanyAsync(id, request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "User added to company successfully" });
        }

        [HttpPost("{id}/users/create")]
        public async Task<IActionResult> CreateAndAddUserToCompany(int id, [FromBody] CreateAndAddUserToCompanyRequest request)
        {
            var result = await _companyService.CreateAndAddUserToCompanyAsync(id, request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "User created and added to company successfully" });
        }

        [HttpDelete("{companyId}/users/{userId}")]
        public async Task<IActionResult> RemoveUserFromCompany(int companyId, int userId)
        {
            var result = await _companyService.RemoveUserFromCompanyAsync(companyId, userId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "User removed from company successfully" });
        }

        [HttpPost("join")]
        public async Task<IActionResult> JoinCompany([FromBody] JoinCompanyRequest request)
        {
            var result = await _companyService.JoinCompanyAsync(request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] UpdateCompanyRequest request)
        {
            var result = await _companyService.UpdateCompanyAsync(id, request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            var result = await _companyService.DeleteCompanyAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "Company deleted successfully" });
        }

        [HttpPut("{companyId}/users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserInCompany(int companyId, int userId, [FromBody] UpdateUserInCompanyRequest request)
        {
            var result = await _companyService.UpdateUserInCompanyAsync(companyId, userId, request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "User updated successfully" });
        }
    }
}

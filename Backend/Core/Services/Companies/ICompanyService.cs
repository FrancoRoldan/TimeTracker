using Core.Common;
using Data.Dtos.Auth;
using Data.Dtos.Company;

namespace Core.Services.Companies
{
    public interface ICompanyService
    {
        Task<Result<CompanyResponse>> CreateCompanyAsync(CreateCompanyRequest request);
        Task<Result<CompanyResponse>> GetCompanyByIdAsync(int id);
        Task<Result<List<CompanyResponse>>> GetAllCompaniesAsync();
        Task<Result<List<CompanyUserResponse>>> GetCompanyUsersAsync(int companyId);
        Task<Result> AddUserToCompanyAsync(int companyId, AddUserToCompanyRequest request);
        Task<Result> RemoveUserFromCompanyAsync(int companyId, int userId);
        Task<Result<RegisterUserResponse>> RegisterUserAsync(RegisterUserRequest request);
        Task<Result<JoinCompanyResponse>> JoinCompanyAsync(JoinCompanyRequest request);
    }
}

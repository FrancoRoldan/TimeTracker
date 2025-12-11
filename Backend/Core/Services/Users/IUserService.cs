using Data.Models;

namespace Core.Services
{
    public interface IUserService
    {
        Task<(User? user, List<UserCompany> companies)> AuthenticateAsync(string email, string password);
        Task<List<UserCompany>> GetUserCompaniesAsync(int userId);
    }
}

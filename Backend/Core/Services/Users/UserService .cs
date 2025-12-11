using Core.Security;
using Data.Dtos;
using Data.Interfaces;
using Data.Models;
using Mapster;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Core.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;

        public UserService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
        }

        public async Task<(User? user, List<UserCompany> companies)> AuthenticateAsync(string email, string password)
        {
            var user = await _unitOfWork.Users.FindAsync(u => u.Email == email);

            if (user == null || !_passwordHasher.VerifyPassword(password, user.Password))
            {
                return (null, new List<UserCompany>());
            }

            // Get user's companies
            var companies = await _unitOfWork.UserCompanies
                .Query()
                .Include(uc => uc.Company)
                .Where(uc => uc.UserId == user.Id)
                .ToListAsync();

            return (user, companies);
        }

        public async Task<List<UserCompany>> GetUserCompaniesAsync(int userId)
        {
            // Get user's companies with company details
            var companies = await _unitOfWork.UserCompanies
                .Query()
                .Include(uc => uc.Company)
                .Where(uc => uc.UserId == userId)
                .ToListAsync();

            return companies;
        }

        // RegisterAsync and GetAllAsync removed - users are created via admin/seeder only
    }
}

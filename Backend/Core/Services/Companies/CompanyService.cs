using Core.Common;
using Core.Security;
using Core.Services.Tenant;
using Data.Dtos.Auth;
using Data.Dtos.Company;
using Data.Enums;
using Data.Interfaces;
using Data.Models;
using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Core.Services.Companies
{
    public class CompanyService : ICompanyService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IValidator<CreateCompanyRequest> _createValidator;
        private readonly IValidator<RegisterUserRequest> _registerValidator;
        private readonly IValidator<JoinCompanyRequest> _joinValidator;
        private readonly ITenantService _tenantService;
        private readonly IPasswordHasher _passwordHasher;

        public CompanyService(
            IUnitOfWork unitOfWork,
            IValidator<CreateCompanyRequest> createValidator,
            IValidator<RegisterUserRequest> registerValidator,
            IValidator<JoinCompanyRequest> joinValidator,
            ITenantService tenantService,
            IPasswordHasher passwordHasher)
        {
            _unitOfWork = unitOfWork;
            _createValidator = createValidator;
            _registerValidator = registerValidator;
            _joinValidator = joinValidator;
            _tenantService = tenantService;
            _passwordHasher = passwordHasher;
        }

        public async Task<Result<CompanyResponse>> CreateCompanyAsync(CreateCompanyRequest request)
        {
            var validationResult = await _createValidator.ValidateAsync(request);
            var userCompany = new UserCompany();

            if (!validationResult.IsValid)
            {
                return Result<CompanyResponse>.Failure(
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                );
            }

            // Check if code already exists
            var existingCompany = await _unitOfWork.Companies.FindAsync(c => c.Code == request.Code);
            if (existingCompany != null)
            {
                return Result<CompanyResponse>.Failure("Company code already exists");
            }

            var company = request.Adapt<Company>();
            company.IsActive = true;

            await _unitOfWork.Companies.AddAsync(company);
            await _unitOfWork.SaveChangesAsync();

            userCompany.CompanyId = company.Id;
            userCompany.UserId = _tenantService.GetCurrentUserId() ?? 0;
            userCompany.Role = UserRole.Admin;

            await _unitOfWork.UserCompanies.AddAsync(userCompany);
            await _unitOfWork.SaveChangesAsync();

            return Result<CompanyResponse>.Success(company.Adapt<CompanyResponse>());
        }

        public async Task<Result<CompanyResponse>> GetCompanyByIdAsync(int id)
        {
            var company = await _unitOfWork.Companies.GetByIdAsync(id);
            if (company == null)
                return Result<CompanyResponse>.Failure("Company not found");

            return Result<CompanyResponse>.Success(company.Adapt<CompanyResponse>());
        }

        public async Task<Result<List<CompanyResponse>>> GetAllCompaniesAsync()
        {
            // Get current authenticated user
            var currentUserId = _tenantService.GetCurrentUserId();
            if (currentUserId == null)
            {
                return Result<List<CompanyResponse>>.Failure("User not authenticated");
            }

            // Get companies where user is a member
            var userCompanies = await _unitOfWork.UserCompanies
                .Query()
                .Where(uc => uc.UserId == currentUserId.Value)
                .Include(uc => uc.Company)
                .ToListAsync();

            var companies = userCompanies.Select(uc => uc.Company).ToList();

            return Result<List<CompanyResponse>>.Success(
                companies.Adapt<List<CompanyResponse>>()
            );
        }

        public async Task<Result<List<CompanyUserResponse>>> GetCompanyUsersAsync(int companyId)
        {
            // Verify company exists
            var company = await _unitOfWork.Companies.GetByIdAsync(companyId);
            if (company == null)
                return Result<List<CompanyUserResponse>>.Failure("Company not found");

            // Get all UserCompany relationships for this company with User included
            var userCompanies = await _unitOfWork.UserCompanies
                .Query()
                .Where(uc => uc.CompanyId == companyId)
                .Include(uc => uc.User)
                .ToListAsync();

            // Map to response DTOs
            var companyUsers = userCompanies.Select(uc => new CompanyUserResponse
            {
                UserId = uc.UserId,
                UserName = uc.User.Nombre,
                UserEmail = uc.User.Email,
                Role = uc.Role.ToString(),
                HourlyRate = uc.HourlyRate,
                JoinedAt = uc.CreatedAt
            }).ToList();

            return Result<List<CompanyUserResponse>>.Success(companyUsers);
        }

        public async Task<Result> AddUserToCompanyAsync(int companyId, AddUserToCompanyRequest request)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                // Verify company exists
                var company = await _unitOfWork.Companies.GetByIdAsync(companyId);
                if (company == null)
                    return Result.Failure("Company not found");

                // Verify user exists
                var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);
                if (user == null)
                    return Result.Failure("User not found");

                // Check if already member
                var existing = await _unitOfWork.UserCompanies.FindAsync(
                    uc => uc.UserId == request.UserId && uc.CompanyId == companyId
                );
                if (existing != null)
                    return Result.Failure("User already belongs to this company");

                var userCompany = new UserCompany
                {
                    UserId = request.UserId,
                    CompanyId = companyId,
                    Role = request.Role,
                    HourlyRate = request.HourlyRate
                };

                await _unitOfWork.UserCompanies.AddAsync(userCompany);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result.Failure($"Error adding user to company: {ex.Message}");
            }
        }

        public async Task<Result> RemoveUserFromCompanyAsync(int companyId, int userId)
        {
            var userCompany = await _unitOfWork.UserCompanies.FindAsync(
                uc => uc.UserId == userId && uc.CompanyId == companyId
            );

            if (userCompany == null)
                return Result.Failure("User is not a member of this company");

            _unitOfWork.UserCompanies.Delete(userCompany);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<RegisterUserResponse>> RegisterUserAsync(RegisterUserRequest request)
        {
            try
            {
                // Validate request
                var validationResult = await _registerValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return Result<RegisterUserResponse>.Failure(
                        validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                    );
                }

                await _unitOfWork.BeginTransactionAsync();

                // Verify company exists
                var company = await _unitOfWork.Companies.GetByIdAsync(request.CompanyId);
                if (company == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<RegisterUserResponse>.Failure("Company not found");
                }

                // Check if email already exists
                var existingUser = await _unitOfWork.Users.FindAsync(u => u.Email == request.Email);
                if (existingUser != null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<RegisterUserResponse>.Failure("Email already registered");
                }

                // Parse role
                if (!Enum.TryParse<UserRole>(request.Role, true, out var userRole))
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<RegisterUserResponse>.Failure("Invalid role");
                }

                // Create user
                var user = new User
                {
                    Nombre = request.Name,
                    Email = request.Email,
                    Password = _passwordHasher.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _unitOfWork.Users.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();

                // Create UserCompany association
                var userCompany = new UserCompany
                {
                    UserId = user.Id,
                    CompanyId = request.CompanyId,
                    Role = userRole,
                    HourlyRate = request.HourlyRate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _unitOfWork.UserCompanies.AddAsync(userCompany);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                // Build response
                var response = new RegisterUserResponse
                {
                    UserId = user.Id,
                    Name = user.Nombre,
                    Email = user.Email,
                    CompanyId = request.CompanyId,
                    CompanyName = company.Name,
                    Role = userRole.ToString(),
                    HourlyRate = request.HourlyRate
                };

                return Result<RegisterUserResponse>.Success(response);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result<RegisterUserResponse>.Failure($"Error registering user: {ex.Message}");
            }
        }

        public async Task<Result<JoinCompanyResponse>> JoinCompanyAsync(JoinCompanyRequest request)
        {
            try
            {
                // Validate request
                var validationResult = await _joinValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return Result<JoinCompanyResponse>.Failure(
                        validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                    );
                }

                // Get current authenticated user
                var currentUserId = _tenantService.GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Result<JoinCompanyResponse>.Failure("User not authenticated");
                }

                await _unitOfWork.BeginTransactionAsync();

                // Verify company exists and is active
                var company = await _unitOfWork.Companies.GetByIdAsync(request.CompanyId);
                if (company == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("Company not found");
                }

                if (!company.IsActive)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("Company is not active");
                }

                // Get user
                var user = await _unitOfWork.Users.GetByIdAsync(currentUserId.Value);
                if (user == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("User not found");
                }

                // Check if already member
                var existingMembership = await _unitOfWork.UserCompanies.FindAsync(
                    uc => uc.UserId == currentUserId.Value && uc.CompanyId == request.CompanyId
                );

                if (existingMembership != null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("You are already a member of this company");
                }

                // Parse role
                if (!Enum.TryParse<UserRole>(request.Role, true, out var userRole))
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("Invalid role");
                }

                // Create UserCompany association
                var userCompany = new UserCompany
                {
                    UserId = currentUserId.Value,
                    CompanyId = request.CompanyId,
                    Role = userRole,
                    HourlyRate = request.HourlyRate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _unitOfWork.UserCompanies.AddAsync(userCompany);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                // Build response
                var response = new JoinCompanyResponse
                {
                    UserId = user.Id,
                    UserName = user.Nombre,
                    UserEmail = user.Email,
                    CompanyId = company.Id,
                    CompanyName = company.Name,
                    CompanyCode = company.Code,
                    Role = userRole.ToString(),
                    HourlyRate = request.HourlyRate,
                    Message = $"Successfully joined {company.Name}"
                };

                return Result<JoinCompanyResponse>.Success(response);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result<JoinCompanyResponse>.Failure($"Error joining company: {ex.Message}");
            }
        }


    }
}

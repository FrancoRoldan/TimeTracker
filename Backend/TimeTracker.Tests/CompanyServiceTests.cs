using Core.Security;
using Core.Services.Companies;
using Core.Services.Tenant;
using Data.Dtos.Auth;
using Data.Dtos.Company;
using Data.Enums;
using Data.Interfaces;
using Data.Models;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable.Moq;
using Moq;
using System.Linq.Expressions;
using TimeTracker.Tests.Helpers;
using Xunit;

namespace TimeTracker.Tests;

public class CompanyServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWork;
    private readonly Mock<ITenantService> _tenantService;
    private readonly Mock<IPasswordHasher> _passwordHasher;
    private readonly Mock<IValidator<CreateCompanyRequest>> _createValidator;
    private readonly Mock<IValidator<RegisterUserRequest>> _registerValidator;
    private readonly Mock<IValidator<JoinCompanyRequest>> _joinValidator;
    private readonly Mock<IValidator<UpdateCompanyRequest>> _updateValidator;
    private readonly Mock<IValidator<UpdateUserInCompanyRequest>> _updateUserValidator;
    private readonly Mock<IRepository<Company>> _companiesRepo;
    private readonly Mock<IRepository<UserCompany>> _userCompaniesRepo;
    private readonly Mock<IUserRepository> _usersRepo;
    private readonly Mock<IRepository<Project>> _projectsRepo;
    private readonly Mock<IRepository<TimeEntry>> _timeEntriesRepo;
    private readonly CompanyService _service;

    public CompanyServiceTests()
    {
        _unitOfWork = new Mock<IUnitOfWork>();
        _tenantService = new Mock<ITenantService>();
        _passwordHasher = new Mock<IPasswordHasher>();
        _createValidator = new Mock<IValidator<CreateCompanyRequest>>();
        _registerValidator = new Mock<IValidator<RegisterUserRequest>>();
        _joinValidator = new Mock<IValidator<JoinCompanyRequest>>();
        _updateValidator = new Mock<IValidator<UpdateCompanyRequest>>();
        _updateUserValidator = new Mock<IValidator<UpdateUserInCompanyRequest>>();
        _companiesRepo = new Mock<IRepository<Company>>();
        _userCompaniesRepo = new Mock<IRepository<UserCompany>>();
        _usersRepo = new Mock<IUserRepository>();
        _projectsRepo = new Mock<IRepository<Project>>();
        _timeEntriesRepo = new Mock<IRepository<TimeEntry>>();

        _unitOfWork.Setup(u => u.Companies).Returns(_companiesRepo.Object);
        _unitOfWork.Setup(u => u.UserCompanies).Returns(_userCompaniesRepo.Object);
        _unitOfWork.Setup(u => u.Users).Returns(_usersRepo.Object);
        _unitOfWork.Setup(u => u.Projects).Returns(_projectsRepo.Object);
        _unitOfWork.Setup(u => u.TimeEntries).Returns(_timeEntriesRepo.Object);

        _service = new CompanyService(
            _unitOfWork.Object,
            _createValidator.Object,
            _registerValidator.Object,
            _joinValidator.Object,
            _updateValidator.Object,
            _updateUserValidator.Object,
            _tenantService.Object,
            _passwordHasher.Object,
            NullLogger<CompanyService>.Instance);
    }

    private void SetupValidValidator<T>(Mock<IValidator<T>> validator)
    {
        validator.Setup(v => v.ValidateAsync(It.IsAny<T>(), default))
            .ReturnsAsync(new ValidationResult());
    }

    // ── CreateCompanyAsync ────────────────────────────────────────────

    [Fact]
    public async Task Create_ValidData_CreatesCompanyAndAddsAdmin()
    {
        var request = new CreateCompanyRequest { Name = "ACME", Code = "ACME01" };
        SetupValidValidator(_createValidator);
        _companiesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Company, bool>>>()))
            .ReturnsAsync((Company?)null);
        _companiesRepo.Setup(r => r.AddAsync(It.IsAny<Company>()))
            .ReturnsAsync((Company c) => { c.Id = 1; return c; });
        _userCompaniesRepo.Setup(r => r.AddAsync(It.IsAny<UserCompany>()))
            .ReturnsAsync((UserCompany uc) => uc);
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);

        var result = await _service.CreateCompanyAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        _userCompaniesRepo.Verify(r => r.AddAsync(It.Is<UserCompany>(
            uc => uc.Role == UserRole.Admin && uc.CompanyId == 1)), Times.Once);
    }

    [Fact]
    public async Task Create_DuplicateCode_Fails()
    {
        var request = new CreateCompanyRequest { Name = "ACME", Code = "ACME01" };
        SetupValidValidator(_createValidator);
        _companiesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Company, bool>>>()))
            .ReturnsAsync(TestDataBuilder.CreateCompany(1, "Existing", "ACME01"));

        var result = await _service.CreateCompanyAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("code already exists");
    }

    // ── GetAllCompaniesAsync ──────────────────────────────────────────

    [Fact]
    public async Task GetAll_AuthenticatedUser_ReturnsUserCompanies()
    {
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);
        var company1 = TestDataBuilder.CreateCompany(1, "ACME");
        var company2 = TestDataBuilder.CreateCompany(2, "Other");
        var ucList = new List<UserCompany>
        {
            new() { UserId = 1, CompanyId = 1, Company = company1 },
            new() { UserId = 1, CompanyId = 2, Company = company2 }
        };
        _userCompaniesRepo.Setup(r => r.Query())
            .Returns(ucList.AsQueryable().BuildMock());

        var result = await _service.GetAllCompaniesAsync();

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_Unauthenticated_Fails()
    {
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns((int?)null);

        var result = await _service.GetAllCompaniesAsync();

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not authenticated");
    }

    // ── AddUserToCompanyAsync ─────────────────────────────────────────

    [Fact]
    public async Task AddUser_Valid_CreatesRelationship()
    {
        var request = new AddUserToCompanyRequest { UserId = 2, Role = UserRole.Developer, HourlyRate = 30m };
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(TestDataBuilder.CreateCompany());
        _usersRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(TestDataBuilder.CreateUser(2, "user2@test.com"));
        _userCompaniesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserCompany, bool>>>()))
            .ReturnsAsync((UserCompany?)null);
        _userCompaniesRepo.Setup(r => r.AddAsync(It.IsAny<UserCompany>()))
            .ReturnsAsync((UserCompany uc) => uc);

        var result = await _service.AddUserToCompanyAsync(1, request);

        result.IsSuccess.Should().BeTrue();
        _unitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
    }

    [Fact]
    public async Task AddUser_AlreadyMember_Fails()
    {
        var request = new AddUserToCompanyRequest { UserId = 2, Role = UserRole.Developer };
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(TestDataBuilder.CreateCompany());
        _usersRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(TestDataBuilder.CreateUser(2));
        _userCompaniesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserCompany, bool>>>()))
            .ReturnsAsync(TestDataBuilder.CreateUserCompany(2, 1));

        var result = await _service.AddUserToCompanyAsync(1, request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("already belongs");
    }

    [Fact]
    public async Task AddUser_UserNotFound_Fails()
    {
        var request = new AddUserToCompanyRequest { UserId = 999, Role = UserRole.Developer };
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(TestDataBuilder.CreateCompany());
        _usersRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((User?)null);

        var result = await _service.AddUserToCompanyAsync(1, request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("User not found");
    }

    // ── CreateAndAddUserToCompanyAsync ─────────────────────────────────

    [Fact]
    public async Task CreateAndAdd_Valid_CreatesUserAndRelationship()
    {
        var request = new CreateAndAddUserToCompanyRequest
        {
            Name = "New User", Email = "new@test.com", Password = "Pass123",
            Role = UserRole.Developer, HourlyRate = 40m
        };
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(TestDataBuilder.CreateCompany());
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);
        _passwordHasher.Setup(p => p.HashPassword("Pass123")).Returns("hashed");
        _usersRepo.Setup(r => r.AddAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => { u.Id = 10; return u; });
        _userCompaniesRepo.Setup(r => r.AddAsync(It.IsAny<UserCompany>()))
            .ReturnsAsync((UserCompany uc) => uc);

        var result = await _service.CreateAndAddUserToCompanyAsync(1, request);

        result.IsSuccess.Should().BeTrue();
        _passwordHasher.Verify(p => p.HashPassword("Pass123"), Times.Once);
        _unitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAndAdd_DuplicateEmail_Fails()
    {
        var request = new CreateAndAddUserToCompanyRequest
        {
            Name = "Dup", Email = "dup@test.com", Password = "Pass123",
            Role = UserRole.Developer
        };
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(TestDataBuilder.CreateCompany());
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(TestDataBuilder.CreateUser(5, "dup@test.com"));

        var result = await _service.CreateAndAddUserToCompanyAsync(1, request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("email already exists");
    }

    // ── RegisterUserAsync ─────────────────────────────────────────────

    [Fact]
    public async Task Register_CompanyId0_CreatesCompanyAndUser()
    {
        var request = new RegisterUserRequest
        {
            Name = "John", Email = "john@test.com", Password = "Pass123",
            CompanyId = 0, Role = "Admin"
        };
        SetupValidValidator(_registerValidator);
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);
        _passwordHasher.Setup(p => p.HashPassword("Pass123")).Returns("hashed");
        _companiesRepo.Setup(r => r.AddAsync(It.IsAny<Company>()))
            .ReturnsAsync((Company c) => { c.Id = 1; return c; });
        _usersRepo.Setup(r => r.AddAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => { u.Id = 1; return u; });
        _userCompaniesRepo.Setup(r => r.AddAsync(It.IsAny<UserCompany>()))
            .ReturnsAsync((UserCompany uc) => uc);

        var result = await _service.RegisterUserAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value!.CompanyId.Should().Be(1);
        result.Value.Role.Should().Be("Admin");
        _companiesRepo.Verify(r => r.AddAsync(It.IsAny<Company>()), Times.Once);
        _unitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
    }

    [Fact]
    public async Task Register_ExistingCompany_AddsUser()
    {
        var company = TestDataBuilder.CreateCompany(5, "Existing Co");
        var request = new RegisterUserRequest
        {
            Name = "Jane", Email = "jane@test.com", Password = "Pass123",
            CompanyId = 5, Role = "Developer"
        };
        SetupValidValidator(_registerValidator);
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);
        _companiesRepo.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(company);
        _passwordHasher.Setup(p => p.HashPassword("Pass123")).Returns("hashed");
        _usersRepo.Setup(r => r.AddAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => { u.Id = 2; return u; });
        _userCompaniesRepo.Setup(r => r.AddAsync(It.IsAny<UserCompany>()))
            .ReturnsAsync((UserCompany uc) => uc);

        var result = await _service.RegisterUserAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value!.CompanyId.Should().Be(5);
        _companiesRepo.Verify(r => r.AddAsync(It.IsAny<Company>()), Times.Never);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Fails()
    {
        var request = new RegisterUserRequest
        {
            Name = "Dup", Email = "dup@test.com", Password = "Pass123",
            CompanyId = 0, Role = "Admin"
        };
        SetupValidValidator(_registerValidator);
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(TestDataBuilder.CreateUser(1, "dup@test.com"));

        var result = await _service.RegisterUserAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Email already registered");
        _unitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
    }

    [Fact]
    public async Task Register_InvalidCompanyId_Fails()
    {
        var request = new RegisterUserRequest
        {
            Name = "Test", Email = "test@test.com", Password = "Pass123",
            CompanyId = 999, Role = "Developer"
        };
        SetupValidValidator(_registerValidator);
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);
        _companiesRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Company?)null);

        var result = await _service.RegisterUserAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Company not found");
        _unitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
    }

    // ── JoinCompanyAsync ──────────────────────────────────────────────

    [Fact]
    public async Task Join_Valid_AddsUserToCompany()
    {
        var request = new JoinCompanyRequest { CompanyId = 1, Role = "Developer", HourlyRate = 40m };
        var company = TestDataBuilder.CreateCompany(1, "ACME");
        var user = TestDataBuilder.CreateUser(1, "user@test.com");

        SetupValidValidator(_joinValidator);
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(company);
        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
        _userCompaniesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserCompany, bool>>>()))
            .ReturnsAsync((UserCompany?)null);
        _userCompaniesRepo.Setup(r => r.AddAsync(It.IsAny<UserCompany>()))
            .ReturnsAsync((UserCompany uc) => uc);

        var result = await _service.JoinCompanyAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value!.CompanyName.Should().Be("ACME");
        _unitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
    }

    [Fact]
    public async Task Join_AlreadyMember_Fails()
    {
        var request = new JoinCompanyRequest { CompanyId = 1, Role = "Developer" };
        SetupValidValidator(_joinValidator);
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(TestDataBuilder.CreateCompany());
        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(TestDataBuilder.CreateUser());
        _userCompaniesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserCompany, bool>>>()))
            .ReturnsAsync(TestDataBuilder.CreateUserCompany(1, 1));

        var result = await _service.JoinCompanyAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("already a member");
    }

    [Fact]
    public async Task Join_InactiveCompany_Fails()
    {
        var request = new JoinCompanyRequest { CompanyId = 1, Role = "Developer" };
        var company = TestDataBuilder.CreateCompany(1);
        company.IsActive = false;

        SetupValidValidator(_joinValidator);
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(company);

        var result = await _service.JoinCompanyAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not active");
    }

    // ── UpdateCompanyAsync ────────────────────────────────────────────

    [Fact]
    public async Task Update_AdminUser_Succeeds()
    {
        var request = new UpdateCompanyRequest { Name = "Updated", Code = "UPD01", IsActive = true };
        var company = TestDataBuilder.CreateCompany(1, "Old", "OLD01");
        var adminUc = TestDataBuilder.CreateUserCompany(1, 1, UserRole.Admin);

        SetupValidValidator(_updateValidator);
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(company);
        _userCompaniesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserCompany, bool>>>()))
            .ReturnsAsync(adminUc);
        _companiesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Company, bool>>>()))
            .ReturnsAsync((Company?)null); // no duplicate code

        var result = await _service.UpdateCompanyAsync(1, request);

        result.IsSuccess.Should().BeTrue();
        _unitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
    }

    [Fact]
    public async Task Update_NonAdmin_Fails()
    {
        var request = new UpdateCompanyRequest { Name = "X", Code = "X", IsActive = true };
        var devUc = TestDataBuilder.CreateUserCompany(1, 1, UserRole.Developer);

        SetupValidValidator(_updateValidator);
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(TestDataBuilder.CreateCompany());
        _userCompaniesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserCompany, bool>>>()))
            .ReturnsAsync(devUc);

        var result = await _service.UpdateCompanyAsync(1, request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Only Admins");
    }

    // ── DeleteCompanyAsync ────────────────────────────────────────────

    [Fact]
    public async Task Delete_NoActiveProjects_Succeeds()
    {
        var company = TestDataBuilder.CreateCompany(1);
        var adminUc = TestDataBuilder.CreateUserCompany(1, 1, UserRole.Admin);

        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(company);
        _userCompaniesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserCompany, bool>>>()))
            .ReturnsAsync(adminUc);

        // No active projects
        var emptyProjects = new List<Project>().AsQueryable().BuildMock();
        _projectsRepo.Setup(r => r.Query()).Returns(emptyProjects);

        // No recent time entries
        var emptyEntries = new List<TimeEntry>().AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(emptyEntries);

        var result = await _service.DeleteCompanyAsync(1);

        result.IsSuccess.Should().BeTrue();
        _unitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
    }

    [Fact]
    public async Task Delete_WithActiveProjects_Fails()
    {
        var company = TestDataBuilder.CreateCompany(1);
        var adminUc = TestDataBuilder.CreateUserCompany(1, 1, UserRole.Admin);

        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(1);
        _companiesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(company);
        _userCompaniesRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<UserCompany, bool>>>()))
            .ReturnsAsync(adminUc);

        var projects = new List<Project> { TestDataBuilder.CreateProject(1, 1) };
        _projectsRepo.Setup(r => r.Query()).Returns(projects.AsQueryable().BuildMock());

        var result = await _service.DeleteCompanyAsync(1);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("project(s)");
        _unitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
    }
}

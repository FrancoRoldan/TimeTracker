using Core.Common;
using Core.Services.Projects;
using Core.Services.Tenant;
using Data.Dtos.Project;
using Data.Enums;
using Data.Interfaces;
using Data.Models;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using MockQueryable.Moq;
using Moq;
using System.Linq.Expressions;
using TimeTracker.Tests.Helpers;
using Xunit;

namespace TimeTracker.Tests;

public class ProjectServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWork;
    private readonly Mock<ITenantService> _tenantService;
    private readonly Mock<IValidator<CreateProjectRequest>> _createValidator;
    private readonly Mock<IRepository<Project>> _projectsRepo;
    private readonly Mock<IRepository<UserCompany>> _userCompaniesRepo;
    private readonly Mock<IRepository<Company>> _companiesRepo;
    private readonly ProjectService _service;

    private const int UserId = 1;
    private const int CompanyId = 1;

    public ProjectServiceTests()
    {
        _unitOfWork = new Mock<IUnitOfWork>();
        _tenantService = new Mock<ITenantService>();
        _createValidator = new Mock<IValidator<CreateProjectRequest>>();
        _projectsRepo = new Mock<IRepository<Project>>();
        _userCompaniesRepo = new Mock<IRepository<UserCompany>>();
        _companiesRepo = new Mock<IRepository<Company>>();

        _unitOfWork.Setup(u => u.Projects).Returns(_projectsRepo.Object);
        _unitOfWork.Setup(u => u.UserCompanies).Returns(_userCompaniesRepo.Object);
        _unitOfWork.Setup(u => u.Companies).Returns(_companiesRepo.Object);

        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(UserId);
        _tenantService.Setup(t => t.GetTenantId()).Returns(CompanyId);

        _service = new ProjectService(
            _unitOfWork.Object,
            _tenantService.Object,
            _createValidator.Object);
    }

    private void SetupValidValidator()
    {
        _createValidator.Setup(v => v.ValidateAsync(It.IsAny<CreateProjectRequest>(), default))
            .ReturnsAsync(new ValidationResult());
    }

    private void SetupUserCompanies(params int[] companyIds)
    {
        var ucList = companyIds.Select(cid =>
            TestDataBuilder.CreateUserCompany(UserId, cid)).ToList();
        _userCompaniesRepo.Setup(r => r.Query())
            .Returns(ucList.AsQueryable().BuildMock());
    }

    private void SetupProjectsQueryable(params Project[] projects)
    {
        _projectsRepo.Setup(r => r.Query())
            .Returns(projects.AsQueryable().BuildMock());
    }

    // ── CreateProjectAsync ────────────────────────────────────────────

    [Fact]
    public async Task Create_ValidData_CreatesProject()
    {
        var request = new CreateProjectRequest { Name = "New Project" };
        SetupValidValidator();

        _projectsRepo.Setup(r => r.AddAsync(It.IsAny<Project>()))
            .ReturnsAsync((Project p) => { p.Id = 1; return p; });

        var companies = new List<Company> { TestDataBuilder.CreateCompany(CompanyId, "ACME") };
        _companiesRepo.Setup(r => r.Query())
            .Returns(companies.AsQueryable().BuildMock());

        var result = await _service.CreateProjectAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Name.Should().Be("New Project");
        result.Value.CompanyName.Should().Be("ACME");
        _projectsRepo.Verify(r => r.AddAsync(It.Is<Project>(
            p => p.CompanyId == CompanyId && p.Status == ProjectStatus.Active)), Times.Once);
    }

    [Fact]
    public async Task Create_NoTenant_Fails()
    {
        var request = new CreateProjectRequest { Name = "X" };
        SetupValidValidator();
        _tenantService.Setup(t => t.GetTenantId()).Returns((int?)null);

        var result = await _service.CreateProjectAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not associated with a company");
    }

    [Fact]
    public async Task Create_ValidationFails_ReturnsErrors()
    {
        var request = new CreateProjectRequest { Name = "" };
        var failures = new List<ValidationFailure>
        {
            new("Name", "Name is required")
        };
        _createValidator.Setup(v => v.ValidateAsync(It.IsAny<CreateProjectRequest>(), default))
            .ReturnsAsync(new ValidationResult(failures));

        var result = await _service.CreateProjectAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Name is required");
    }

    // ── GetProjectByIdAsync ───────────────────────────────────────────

    [Fact]
    public async Task GetById_OwnProject_ReturnsProject()
    {
        var project = TestDataBuilder.CreateProject(1, CompanyId, "My Project");
        project.Company = TestDataBuilder.CreateCompany(CompanyId, "ACME");
        project.Issues = new List<Issue>();

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project);

        var result = await _service.GetProjectByIdAsync(1);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().Be(1);
        result.Value.Name.Should().Be("My Project");
    }

    [Fact]
    public async Task GetById_OtherCompanyProject_Fails()
    {
        var project = TestDataBuilder.CreateProject(1, companyId: 999);

        SetupUserCompanies(CompanyId); // user only in company 1
        SetupProjectsQueryable(project); // project in company 999

        var result = await _service.GetProjectByIdAsync(1);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not found or you don't have access");
    }

    [Fact]
    public async Task GetById_Unauthenticated_Fails()
    {
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns((int?)null);

        var result = await _service.GetProjectByIdAsync(1);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not authenticated");
    }

    // ── GetAllProjectsAsync ───────────────────────────────────────────

    [Fact]
    public async Task GetAll_WithCompanyId_ReturnsCompanyProjects()
    {
        var company = TestDataBuilder.CreateCompany(CompanyId, "ACME");
        var project1 = TestDataBuilder.CreateProject(1, CompanyId, "P1");
        project1.Company = company;
        project1.Issues = new List<Issue>();
        var project2 = TestDataBuilder.CreateProject(2, CompanyId, "P2");
        project2.Company = company;
        project2.Issues = new List<Issue>();

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project1, project2);

        var result = await _service.GetAllProjectsAsync(CompanyId);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_NoCompanyId_ReturnsUserProjects()
    {
        var company = TestDataBuilder.CreateCompany(CompanyId, "ACME");
        var project = TestDataBuilder.CreateProject(1, CompanyId, "P1");
        project.Company = company;
        project.Issues = new List<Issue>();

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project);

        var result = await _service.GetAllProjectsAsync(null);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetAll_NoCompanyId_Unauthenticated_Fails()
    {
        _tenantService.Setup(t => t.GetCurrentUserId()).Returns((int?)null);

        var result = await _service.GetAllProjectsAsync(null);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not authenticated");
    }

    [Fact]
    public async Task GetAll_UserWithNoCompanies_IsForbidden()
    {
        // Antes devolvía una lista vacía, lo que ocultaba el problema: si el token
        // dice que la empresa activa es X pero el usuario no pertenece a X, es un
        // fallo de acceso, no un resultado sin datos.
        SetupUserCompanies(); // sin empresas
        SetupProjectsQueryable();

        var result = await _service.GetAllProjectsAsync(null);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCode.Forbidden);
    }

    [Fact]
    public async Task GetAll_CompanyIdDeOtraEmpresa_IsForbidden()
    {
        // El companyId llega por query string: lo propone la request, no es una
        // fuente confiable. Antes se filtraba por él sin comprobar la pertenencia,
        // así que se podían listar los proyectos de una empresa ajena.
        const int empresaAjena = 999;
        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(TestDataBuilder.CreateProject(1, empresaAjena, "Ajeno"));

        var result = await _service.GetAllProjectsAsync(empresaAjena);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCode.Forbidden);
    }

    [Fact]
    public async Task GetAll_SinCompanyId_UsaSoloLaEmpresaActiva()
    {
        // El desplegable de carga manual mostraba proyectos de otras empresas
        // porque se listaban todas las del usuario en vez de la activa.
        var otraEmpresa = 2;
        _tenantService.Setup(t => t.GetTenantId()).Returns(CompanyId);
        SetupUserCompanies(CompanyId, otraEmpresa);

        var propio = TestDataBuilder.CreateProject(1, CompanyId, "De la empresa activa");
        propio.Company = TestDataBuilder.CreateCompany(CompanyId, "ACME");
        propio.Issues = new List<Issue>();

        var ajeno = TestDataBuilder.CreateProject(2, otraEmpresa, "De la otra empresa");
        ajeno.Company = TestDataBuilder.CreateCompany(otraEmpresa, "TechStart");
        ajeno.Issues = new List<Issue>();

        SetupProjectsQueryable(propio, ajeno);

        var result = await _service.GetAllProjectsAsync(null);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value![0].Name.Should().Be("De la empresa activa");
    }

    // ── UpdateProjectAsync ────────────────────────────────────────────

    [Fact]
    public async Task Update_OwnProject_Succeeds()
    {
        var project = TestDataBuilder.CreateProject(1, CompanyId, "Old Name");
        project.Company = TestDataBuilder.CreateCompany(CompanyId, "ACME");
        project.Issues = new List<Issue>();

        var request = new UpdateProjectRequest { Name = "New Name", Status = ProjectStatus.Completed };

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project);
        _projectsRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(project);

        var result = await _service.UpdateProjectAsync(1, request);

        result.IsSuccess.Should().BeTrue();
        project.Name.Should().Be("New Name");
        project.Status.Should().Be(ProjectStatus.Completed);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.AtLeastOnce);
    }

    [Fact]
    public async Task Update_OtherCompanyProject_Fails()
    {
        var project = TestDataBuilder.CreateProject(1, companyId: 999);
        var request = new UpdateProjectRequest { Name = "Hack" };

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project);

        var result = await _service.UpdateProjectAsync(1, request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not found or you don't have access");
    }

    // ── DeleteProjectAsync ────────────────────────────────────────────

    [Fact]
    public async Task Delete_OwnProject_Succeeds()
    {
        var project = TestDataBuilder.CreateProject(1, CompanyId);

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project);
        _projectsRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(project);

        var result = await _service.DeleteProjectAsync(1);

        result.IsSuccess.Should().BeTrue();
        _projectsRepo.Verify(r => r.Delete(project), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Delete_OtherCompanyProject_Fails()
    {
        var project = TestDataBuilder.CreateProject(1, companyId: 999);

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project);

        var result = await _service.DeleteProjectAsync(1);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not found or you don't have access");
    }

    // ── ChangeProjectStatusAsync ──────────────────────────────────────

    [Fact]
    public async Task ChangeStatus_OwnProject_Succeeds()
    {
        var project = TestDataBuilder.CreateProject(1, CompanyId);
        project.Status = ProjectStatus.Active;

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project);
        _projectsRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(project);

        var result = await _service.ChangeProjectStatusAsync(1, ProjectStatus.Completed);

        result.IsSuccess.Should().BeTrue();
        project.Status.Should().Be(ProjectStatus.Completed);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task ChangeStatus_OtherCompanyProject_Fails()
    {
        var project = TestDataBuilder.CreateProject(1, companyId: 999);

        SetupUserCompanies(CompanyId);
        SetupProjectsQueryable(project);

        var result = await _service.ChangeProjectStatusAsync(1, ProjectStatus.Completed);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not found or you don't have access");
    }
}

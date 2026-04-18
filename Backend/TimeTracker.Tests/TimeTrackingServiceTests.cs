using Core.Services.Tenant;
using Core.Services.TimeTracking;
using Data.Dtos.TimeEntry;
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

public class TimeTrackingServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWork;
    private readonly Mock<ITenantService> _tenantService;
    private readonly Mock<IValidator<StartTimerRequest>> _startValidator;
    private readonly Mock<IValidator<AddManualEntryRequest>> _manualValidator;
    private readonly Mock<IRepository<TimeEntry>> _timeEntriesRepo;
    private readonly Mock<IRepository<Issue>> _issuesRepo;
    private readonly Mock<IRepository<Project>> _projectsRepo;
    private readonly TimeTrackingService _service;

    private const int UserId = 1;
    private const int CompanyId = 1;

    public TimeTrackingServiceTests()
    {
        _unitOfWork = new Mock<IUnitOfWork>();
        _tenantService = new Mock<ITenantService>();
        _startValidator = new Mock<IValidator<StartTimerRequest>>();
        _manualValidator = new Mock<IValidator<AddManualEntryRequest>>();
        _timeEntriesRepo = new Mock<IRepository<TimeEntry>>();
        _issuesRepo = new Mock<IRepository<Issue>>();
        _projectsRepo = new Mock<IRepository<Project>>();

        _unitOfWork.Setup(u => u.TimeEntries).Returns(_timeEntriesRepo.Object);
        _unitOfWork.Setup(u => u.Issues).Returns(_issuesRepo.Object);
        _unitOfWork.Setup(u => u.Projects).Returns(_projectsRepo.Object);

        _tenantService.Setup(t => t.GetCurrentUserId()).Returns(UserId);
        _tenantService.Setup(t => t.GetTenantId()).Returns(CompanyId);

        _service = new TimeTrackingService(
            _unitOfWork.Object,
            _tenantService.Object,
            _startValidator.Object,
            _manualValidator.Object);
    }

    private void SetupValidStartValidator()
    {
        _startValidator.Setup(v => v.ValidateAsync(It.IsAny<StartTimerRequest>(), default))
            .ReturnsAsync(new ValidationResult());
    }

    private void SetupValidManualValidator()
    {
        _manualValidator.Setup(v => v.ValidateAsync(It.IsAny<AddManualEntryRequest>(), default))
            .ReturnsAsync(new ValidationResult());
    }

    private void SetupNoActiveTimer()
    {
        var emptyEntries = new List<TimeEntry>().AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(emptyEntries);
    }

    private void SetupActiveTimer(TimeEntry activeTimer)
    {
        var entries = new List<TimeEntry> { activeTimer }.AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries);
    }

    private void SetupIssue(Issue issue)
    {
        var issues = new List<Issue> { issue }.AsQueryable().BuildMock();
        _issuesRepo.Setup(r => r.Query()).Returns(issues);
    }

    private void SetupProject(Project project)
    {
        var projects = new List<Project> { project }.AsQueryable().BuildMock();
        _projectsRepo.Setup(r => r.Query()).Returns(projects);
    }

    // ── StartTimerAsync ───────────────────────────────────────────────

    [Fact]
    public async Task StartTimer_ValidIssue_CreatesEntry()
    {
        var request = new StartTimerRequest { IssueId = 1, Description = "Working" };
        var issue = TestDataBuilder.CreateIssue(1, 1, UserId, CompanyId);

        SetupValidStartValidator();
        SetupNoActiveTimer();
        SetupIssue(issue);

        _timeEntriesRepo.Setup(r => r.AddAsync(It.IsAny<TimeEntry>()))
            .ReturnsAsync((TimeEntry te) => { te.Id = 1; return te; });

        var result = await _service.StartTimerAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value!.IssueId.Should().Be(1);
        _timeEntriesRepo.Verify(r => r.AddAsync(It.IsAny<TimeEntry>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task StartTimer_ActiveTimerExists_Fails()
    {
        var request = new StartTimerRequest { IssueId = 1 };
        var activeTimer = TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, endTime: null);

        SetupValidStartValidator();
        SetupActiveTimer(activeTimer);

        var result = await _service.StartTimerAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("already have an active timer");
        _timeEntriesRepo.Verify(r => r.AddAsync(It.IsAny<TimeEntry>()), Times.Never);
    }

    [Fact]
    public async Task StartTimer_UnassignedIssue_Fails()
    {
        var request = new StartTimerRequest { IssueId = 1 };
        var issue = TestDataBuilder.CreateIssue(1, 1, assignedUserId: 999, companyId: CompanyId);

        SetupValidStartValidator();
        SetupNoActiveTimer();
        SetupIssue(issue);

        var result = await _service.StartTimerAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("assigned to you");
    }

    [Fact]
    public async Task StartTimer_IssueDifferentCompany_Fails()
    {
        var request = new StartTimerRequest { IssueId = 1 };
        var issue = TestDataBuilder.CreateIssue(1, 1, UserId, companyId: 999);

        SetupValidStartValidator();
        SetupNoActiveTimer();
        SetupIssue(issue);

        var result = await _service.StartTimerAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("other companies");
    }

    [Fact]
    public async Task StartTimer_ValidProject_CreatesEntry()
    {
        var request = new StartTimerRequest { ProjectId = 1 };
        var project = TestDataBuilder.CreateProject(1, CompanyId);

        SetupValidStartValidator();
        SetupNoActiveTimer();
        SetupProject(project);

        _timeEntriesRepo.Setup(r => r.AddAsync(It.IsAny<TimeEntry>()))
            .ReturnsAsync((TimeEntry te) => { te.Id = 1; return te; });

        var result = await _service.StartTimerAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value!.ProjectId.Should().Be(1);
    }

    [Fact]
    public async Task StartTimer_ProjectDifferentCompany_Fails()
    {
        var request = new StartTimerRequest { ProjectId = 1 };
        var project = TestDataBuilder.CreateProject(1, companyId: 999);

        SetupValidStartValidator();
        SetupNoActiveTimer();
        SetupProject(project);

        var result = await _service.StartTimerAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("other companies");
    }

    [Fact]
    public async Task StartTimer_NoIssueNorProject_Fails()
    {
        var request = new StartTimerRequest { IssueId = null, ProjectId = null };

        SetupValidStartValidator();
        SetupNoActiveTimer();

        var result = await _service.StartTimerAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Either IssueId or ProjectId");
    }

    // ── StopTimerAsync ────────────────────────────────────────────────

    [Fact]
    public async Task StopTimer_ActiveTimer_SetsEndTime()
    {
        var activeTimer = TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, endTime: null);
        SetupActiveTimer(activeTimer);

        // Also setup for the issue load after stop
        var emptyIssues = new List<Issue>().AsQueryable().BuildMock();
        _issuesRepo.Setup(r => r.Query()).Returns(emptyIssues);

        var result = await _service.StopTimerAsync();

        result.IsSuccess.Should().BeTrue();
        result.Value!.EndTime.Should().NotBeNull();
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task StopTimer_NoActiveTimer_Fails()
    {
        SetupNoActiveTimer();

        var result = await _service.StopTimerAsync();

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("No active timer");
    }

    // ── GetActiveTimerAsync ───────────────────────────────────────────

    [Fact]
    public async Task GetActiveTimer_Exists_ReturnsTimer()
    {
        var issue = TestDataBuilder.CreateIssue(1, 1, UserId, CompanyId);
        var activeTimer = TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, endTime: null, issueId: 1);
        activeTimer.Issue = issue;

        SetupActiveTimer(activeTimer);

        var result = await _service.GetActiveTimerAsync();

        result.IsSuccess.Should().BeTrue();
        result.Value!.EndTime.Should().BeNull();
        result.Value.IssueId.Should().Be(1);
    }

    [Fact]
    public async Task GetActiveTimer_None_Fails()
    {
        SetupNoActiveTimer();

        var result = await _service.GetActiveTimerAsync();

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("No active timer");
    }

    // ── AddManualEntryAsync ───────────────────────────────────────────

    [Fact]
    public async Task AddManual_ValidRange_CreatesEntry()
    {
        var start = DateTime.UtcNow.AddHours(-2);
        var end = DateTime.UtcNow.AddHours(-1);
        var request = new AddManualEntryRequest
        {
            ProjectId = 1, StartTime = start, EndTime = end, Description = "Manual"
        };
        var project = TestDataBuilder.CreateProject(1, CompanyId);

        SetupValidManualValidator();
        SetupProject(project);

        // No overlapping entries
        var emptyEntries = new List<TimeEntry>().AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(emptyEntries);

        _timeEntriesRepo.Setup(r => r.AddAsync(It.IsAny<TimeEntry>()))
            .ReturnsAsync((TimeEntry te) => { te.Id = 1; return te; });

        var result = await _service.AddManualEntryAsync(request);

        result.IsSuccess.Should().BeTrue();
        _timeEntriesRepo.Verify(r => r.AddAsync(It.IsAny<TimeEntry>()), Times.Once);
    }

    [Fact]
    public async Task AddManual_Overlapping_Fails()
    {
        var start = DateTime.UtcNow.AddHours(-2);
        var end = DateTime.UtcNow.AddHours(-1);
        var request = new AddManualEntryRequest
        {
            ProjectId = 1, StartTime = start, EndTime = end
        };
        var project = TestDataBuilder.CreateProject(1, CompanyId);

        SetupValidManualValidator();
        SetupProject(project);

        // Existing overlapping entry
        var existingEntry = TestDataBuilder.CreateTimeEntry(
            1, UserId, CompanyId,
            startTime: start.AddMinutes(-30),
            endTime: start.AddMinutes(30));
        var entries = new List<TimeEntry> { existingEntry }.AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries);

        var result = await _service.AddManualEntryAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("overlaps");
    }

    [Fact]
    public async Task AddManual_ValidProject_CreatesEntry()
    {
        var start = DateTime.UtcNow.AddHours(-3);
        var end = DateTime.UtcNow.AddHours(-2);
        var request = new AddManualEntryRequest { ProjectId = 1, StartTime = start, EndTime = end };
        var project = TestDataBuilder.CreateProject(1, CompanyId);

        SetupValidManualValidator();
        SetupProject(project);

        var emptyEntries = new List<TimeEntry>().AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(emptyEntries);

        _timeEntriesRepo.Setup(r => r.AddAsync(It.IsAny<TimeEntry>()))
            .ReturnsAsync((TimeEntry te) => { te.Id = 1; return te; });

        var result = await _service.AddManualEntryAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Value!.ProjectId.Should().Be(1);
    }

    [Fact]
    public async Task AddManual_NoIssueNorProject_Fails()
    {
        var request = new AddManualEntryRequest
        {
            IssueId = null, ProjectId = null,
            StartTime = DateTime.UtcNow.AddHours(-1), EndTime = DateTime.UtcNow
        };

        SetupValidManualValidator();

        var result = await _service.AddManualEntryAsync(request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Either IssueId or ProjectId");
    }

    // ── GetUserEntriesAsync ───────────────────────────────────────────

    [Fact]
    public async Task GetEntries_WithDateRange_FiltersCorrectly()
    {
        var now = DateTime.UtcNow;
        var entries = new List<TimeEntry>
        {
            TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, startTime: now.AddDays(-1), endTime: now),
            TestDataBuilder.CreateTimeEntry(2, UserId, CompanyId, startTime: now.AddDays(-10), endTime: now.AddDays(-9))
        };
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries.AsQueryable().BuildMock());

        var result = await _service.GetUserEntriesAsync(dateFrom: now.AddDays(-2), dateTo: now);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value![0].Id.Should().Be(1);
    }

    [Fact]
    public async Task GetEntries_WithProjectFilter_FiltersCorrectly()
    {
        var entries = new List<TimeEntry>
        {
            TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, projectId: 1, endTime: DateTime.UtcNow),
            TestDataBuilder.CreateTimeEntry(2, UserId, CompanyId, projectId: 2, endTime: DateTime.UtcNow)
        };
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries.AsQueryable().BuildMock());

        var result = await _service.GetUserEntriesAsync(projectId: 1);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value![0].ProjectId.Should().Be(1);
    }

    [Fact]
    public async Task GetEntries_NoFilters_ReturnsAll()
    {
        var entries = new List<TimeEntry>
        {
            TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, endTime: DateTime.UtcNow),
            TestDataBuilder.CreateTimeEntry(2, UserId, CompanyId, endTime: DateTime.UtcNow),
            TestDataBuilder.CreateTimeEntry(3, UserId, CompanyId, endTime: DateTime.UtcNow)
        };
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries.AsQueryable().BuildMock());

        var result = await _service.GetUserEntriesAsync();

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(3);
    }

    // ── GetEntryByIdAsync ─────────────────────────────────────────────

    [Fact]
    public async Task GetById_OwnEntry_ReturnsEntry()
    {
        var entry = TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, endTime: DateTime.UtcNow);
        var entries = new List<TimeEntry> { entry }.AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries);

        var result = await _service.GetEntryByIdAsync(1);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().Be(1);
    }

    [Fact]
    public async Task GetById_OtherUserEntry_Fails()
    {
        var entry = TestDataBuilder.CreateTimeEntry(1, userId: 999, companyId: CompanyId, endTime: DateTime.UtcNow);
        var entries = new List<TimeEntry> { entry }.AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries);

        var result = await _service.GetEntryByIdAsync(1);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("don't have access");
    }

    [Fact]
    public async Task GetById_NotFound_Fails()
    {
        var emptyEntries = new List<TimeEntry>().AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(emptyEntries);

        var result = await _service.GetEntryByIdAsync(999);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not found");
    }

    // ── UpdateEntryAsync ──────────────────────────────────────────────

    [Fact]
    public async Task Update_ValidData_UpdatesEntry()
    {
        var entry = TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId,
            startTime: DateTime.UtcNow.AddHours(-2), endTime: DateTime.UtcNow.AddHours(-1));
        var request = new UpdateTimeEntryRequest { Description = "Updated" };

        var entries = new List<TimeEntry> { entry }.AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries);

        var result = await _service.UpdateEntryAsync(1, request);

        result.IsSuccess.Should().BeTrue();
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.AtLeastOnce);
    }

    [Fact]
    public async Task Update_RunningTimer_Fails()
    {
        var entry = TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, endTime: null);
        var request = new UpdateTimeEntryRequest
        {
            StartTime = DateTime.UtcNow.AddHours(-1),
            EndTime = DateTime.UtcNow
        };

        var entries = new List<TimeEntry> { entry }.AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries);

        var result = await _service.UpdateEntryAsync(1, request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("running timer");
    }

    [Fact]
    public async Task Update_InvalidTimeRange_Fails()
    {
        var now = DateTime.UtcNow;
        var entry = TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId,
            startTime: now.AddHours(-2), endTime: now.AddHours(-1));
        var request = new UpdateTimeEntryRequest
        {
            StartTime = now,
            EndTime = now.AddHours(-1) // end before start
        };

        var entries = new List<TimeEntry> { entry }.AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries);

        var result = await _service.UpdateEntryAsync(1, request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Start time must be before end time");
    }

    [Fact]
    public async Task Update_OtherUserEntry_Fails()
    {
        var entry = TestDataBuilder.CreateTimeEntry(1, userId: 999, companyId: CompanyId,
            endTime: DateTime.UtcNow);
        var request = new UpdateTimeEntryRequest { Description = "Hack" };

        var entries = new List<TimeEntry> { entry }.AsQueryable().BuildMock();
        _timeEntriesRepo.Setup(r => r.Query()).Returns(entries);

        var result = await _service.UpdateEntryAsync(1, request);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("don't have access");
    }

    // ── DeleteEntryAsync ──────────────────────────────────────────────

    [Fact]
    public async Task Delete_OwnEntry_Succeeds()
    {
        var entry = TestDataBuilder.CreateTimeEntry(1, UserId, CompanyId, endTime: DateTime.UtcNow);

        _timeEntriesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(entry);

        var result = await _service.DeleteEntryAsync(1);

        result.IsSuccess.Should().BeTrue();
        _timeEntriesRepo.Verify(r => r.Delete(entry), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Delete_OtherUserEntry_Fails()
    {
        var entry = TestDataBuilder.CreateTimeEntry(1, userId: 999, companyId: CompanyId);

        _timeEntriesRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(entry);

        var result = await _service.DeleteEntryAsync(1);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("don't have access");
        _timeEntriesRepo.Verify(r => r.Delete(It.IsAny<TimeEntry>()), Times.Never);
    }
}

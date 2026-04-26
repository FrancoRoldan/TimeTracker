using Core.Common;
using Core.Services.Tenant;
using Data.Dtos;
using Data.Dtos.TimeEntry;
using Data.Interfaces;
using Data.Models;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Core.Services.TimeTracking
{
    public class TimeTrackingService : ITimeTrackingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITenantService _tenantService;
        private readonly IValidator<StartTimerRequest> _startValidator;
        private readonly IValidator<AddManualEntryRequest> _manualValidator;

        public TimeTrackingService(
            IUnitOfWork unitOfWork,
            ITenantService tenantService,
            IValidator<StartTimerRequest> startValidator,
            IValidator<AddManualEntryRequest> manualValidator)
        {
            _unitOfWork = unitOfWork;
            _tenantService = tenantService;
            _startValidator = startValidator;
            _manualValidator = manualValidator;
        }

        public async Task<Result<TimeEntryResponse>> StartTimerAsync(StartTimerRequest request)
        {
            var validationResult = await _startValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
                return Result<TimeEntryResponse>.Failure(
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                );

            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<TimeEntryResponse>.Failure("User not authenticated");

            // CRITICAL: Check for active timer (optimized with AsNoTracking)
            var activeTimer = await _unitOfWork.TimeEntries
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(te => te.UserId == userId && te.EndTime == null);

            if (activeTimer != null)
                return Result<TimeEntryResponse>.Failure(
                    "You already have an active timer running. Please stop it before starting a new one."
                );

            var companyId = _tenantService.GetTenantId();
            Issue? issue = null;
            int? issueId = request.IssueId;
            int? projectId = request.ProjectId;

            // Handle two cases: tracking time on an issue OR directly on a project
            if (request.IssueId.HasValue)
            {
                // CRITICAL: Verify issue exists and user has access (optimized - only load needed fields)
                var issueValidation = await _unitOfWork.Issues
                    .Query()
                    .AsNoTracking()
                    .Where(i => i.Id == request.IssueId)
                    .Select(i => new { i.Id, i.ProjectId, i.AssignedUserId, ProjectCompanyId = i.Project.CompanyId, i.Title })
                    .FirstOrDefaultAsync();

                if (issueValidation == null)
                    return Result<TimeEntryResponse>.Failure("Issue not found");

                // CRITICAL: Security - Verify issue belongs to user's company
                if (issueValidation.ProjectCompanyId != companyId)
                    return Result<TimeEntryResponse>.Failure(
                        "You cannot track time on issues from other companies"
                    );

                // CRITICAL: Security - Verify issue is assigned to the user
                if (issueValidation.AssignedUserId != userId)
                    return Result<TimeEntryResponse>.Failure(
                        "You can only track time on issues assigned to you"
                    );

                projectId = issueValidation.ProjectId;
                // Load full issue for response building (only if validation passes)
                issue = await _unitOfWork.Issues
                    .Query()
                    .AsNoTracking()
                    .Include(i => i.Project)
                    .FirstOrDefaultAsync(i => i.Id == request.IssueId);
            }
            else if (request.ProjectId.HasValue)
            {
                // Tracking time directly on project (optimized - only load CompanyId for validation)
                var projectCompanyId = await _unitOfWork.Projects
                    .Query()
                    .AsNoTracking()
                    .Where(p => p.Id == request.ProjectId)
                    .Select(p => p.CompanyId)
                    .FirstOrDefaultAsync();

                if (projectCompanyId == 0)
                    return Result<TimeEntryResponse>.Failure("Project not found");

                // CRITICAL: Security - Verify project belongs to user's company
                if (projectCompanyId != companyId)
                    return Result<TimeEntryResponse>.Failure(
                        "You cannot track time on projects from other companies"
                    );
            }
            else
            {
                return Result<TimeEntryResponse>.Failure("Either IssueId or ProjectId must be provided");
            }

            var timeEntry = new TimeEntry
            {
                IssueId = issueId,
                ProjectId = projectId,
                UserId = userId.Value,
                StartTime = DateTime.UtcNow,
                Description = request.Description,
                CompanyId = companyId??0
            };

            await _unitOfWork.TimeEntries.AddAsync(timeEntry);
            await _unitOfWork.SaveChangesAsync();

            // Build response with related data
            return Result<TimeEntryResponse>.Success(BuildTimeEntryResponse(timeEntry, issue));
        }

        public async Task<Result<TimeEntryResponse>> StopTimerAsync()
        {
            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<TimeEntryResponse>.Failure("User not authenticated");

            // Optimized: Load with tracking only what needs to be updated
            var activeTimer = await _unitOfWork.TimeEntries
                .Query()
                .FirstOrDefaultAsync(te => te.UserId == userId && te.EndTime == null);

            if (activeTimer == null)
                return Result<TimeEntryResponse>.Failure("No active timer found");

            activeTimer.EndTime = DateTime.UtcNow;
            _unitOfWork.TimeEntries.Update(activeTimer);
            await _unitOfWork.SaveChangesAsync();

            // Load related data separately for response (AsNoTracking)
            var issue = activeTimer.IssueId.HasValue
                ? await _unitOfWork.Issues
                    .Query()
                    .AsNoTracking()
                    .Include(i => i.Project)
                    .FirstOrDefaultAsync(i => i.Id == activeTimer.IssueId)
                : null;

            return Result<TimeEntryResponse>.Success(BuildTimeEntryResponse(activeTimer, issue));
        }

        public async Task<Result<TimeEntryResponse>> GetActiveTimerAsync()
        {
            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<TimeEntryResponse>.Failure("User not authenticated");

            var companyId = _tenantService.GetTenantId();

            // Optimized: AsNoTracking for read-only query
            var activeTimer = await _unitOfWork.TimeEntries
                .Query()
                .AsNoTracking()
                .Include(te => te.Issue)
                    .ThenInclude(i => i.Project)
                .Include(te => te.User)
                .FirstOrDefaultAsync(te => te.UserId == userId && te.EndTime == null && te.CompanyId == companyId);

            if (activeTimer == null)
                return Result<TimeEntryResponse>.Failure("No active timer found");

            return Result<TimeEntryResponse>.Success(BuildTimeEntryResponse(activeTimer, activeTimer.Issue));
        }

        public async Task<Result<TimeEntryResponse>> AddManualEntryAsync(AddManualEntryRequest request)
        {
            var validationResult = await _manualValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
                return Result<TimeEntryResponse>.Failure(
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                );

            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<TimeEntryResponse>.Failure("User not authenticated");

            var companyId = _tenantService.GetTenantId();
            Issue? issue = null;
            int? issueId = request.IssueId;
            int? projectId = request.ProjectId;

            // Handle two cases: tracking time on an issue OR directly on a project
            if (request.IssueId.HasValue)
            {
                // CRITICAL: Verify issue exists and user has access (optimized - only load needed fields)
                var issueValidation = await _unitOfWork.Issues
                    .Query()
                    .AsNoTracking()
                    .Where(i => i.Id == request.IssueId)
                    .Select(i => new { i.Id, i.ProjectId, i.AssignedUserId, ProjectCompanyId = i.Project.CompanyId, i.Title })
                    .FirstOrDefaultAsync();

                if (issueValidation == null)
                    return Result<TimeEntryResponse>.Failure("Issue not found");

                // CRITICAL: Security - Verify issue belongs to user's company
                if (issueValidation.ProjectCompanyId != companyId)
                    return Result<TimeEntryResponse>.Failure(
                        "You cannot track time on issues from other companies"
                    );

                // CRITICAL: Security - Verify issue is assigned to the user
                if (issueValidation.AssignedUserId != userId)
                    return Result<TimeEntryResponse>.Failure(
                        "You can only track time on issues assigned to you"
                    );

                projectId = issueValidation.ProjectId;
                // Load full issue for response building (only if validation passes)
                issue = await _unitOfWork.Issues
                    .Query()
                    .AsNoTracking()
                    .Include(i => i.Project)
                    .FirstOrDefaultAsync(i => i.Id == request.IssueId);
            }
            else if (request.ProjectId.HasValue)
            {
                // Tracking time directly on project (optimized - only load CompanyId for validation)
                var projectCompanyId = await _unitOfWork.Projects
                    .Query()
                    .AsNoTracking()
                    .Where(p => p.Id == request.ProjectId)
                    .Select(p => p.CompanyId)
                    .FirstOrDefaultAsync();

                if (projectCompanyId == 0)
                    return Result<TimeEntryResponse>.Failure("Project not found");

                // CRITICAL: Security - Verify project belongs to user's company
                if (projectCompanyId != companyId)
                    return Result<TimeEntryResponse>.Failure(
                        "You cannot track time on projects from other companies"
                    );
            }
            else
            {
                return Result<TimeEntryResponse>.Failure("Either IssueId or ProjectId must be provided");
            }

            // CRITICAL: Check for overlapping entries (optimized with AsNoTracking)
            var hasOverlap = await _unitOfWork.TimeEntries
                .Query()
                .AsNoTracking()
                .AnyAsync(te =>
                    te.UserId == userId &&
                    (
                        // Check if existing entry overlaps with new entry
                        (te.StartTime < request.EndTime && te.EndTime > request.StartTime) ||
                        // Check if active timer exists during new entry period
                        (te.StartTime < request.EndTime && te.EndTime == null)
                    )
                );

            if (hasOverlap)
                return Result<TimeEntryResponse>.Failure(
                    "This time entry overlaps with an existing entry"
                );

            var timeEntry = new TimeEntry
            {
                IssueId = issueId,
                ProjectId = projectId,
                UserId = userId.Value,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Description = request.Description,
                CompanyId = companyId??0
            };

            await _unitOfWork.TimeEntries.AddAsync(timeEntry);
            await _unitOfWork.SaveChangesAsync();

            return Result<TimeEntryResponse>.Success(BuildTimeEntryResponse(timeEntry, issue));
        }

        public async Task<Result<List<TimeEntryResponse>>> GetUserEntriesAsync(
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? projectId = null,
            int? issueId = null)
        {
            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<List<TimeEntryResponse>>.Failure("User not authenticated");

            var companyId = _tenantService.GetTenantId();

            // Optimized: AsNoTracking for read-only query
            var query = _unitOfWork.TimeEntries
                .Query()
                .AsNoTracking()
                .Where(te => te.UserId == userId && te.CompanyId == companyId);

            if (dateFrom.HasValue)
                query = query.Where(te => te.StartTime >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(te => te.EndTime < dateTo.Value.Date.AddDays(1) || te.EndTime == null);

            if (projectId.HasValue)
                query = query.Where(te => te.ProjectId == projectId.Value);

            if (issueId.HasValue)
                query = query.Where(te => te.IssueId == issueId.Value);

            var entries = await query
                .Include(te => te.Issue)
                    .ThenInclude(i => i.Project)
                .Include(te => te.User)
                .OrderByDescending(te => te.StartTime)
                .ToListAsync();

            var responses = entries.Select(te => BuildTimeEntryResponse(te, te.Issue)).ToList();
            return Result<List<TimeEntryResponse>>.Success(responses);
        }

        public async Task<Result<PaginatedResult<TimeEntryResponse>>> GetUserEntriesPaginatedAsync(
            int pageNumber = 0,
            int pageSize = 10,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? projectId = null,
            int? issueId = null,
            string? searchTerm = null)
        {
            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<PaginatedResult<TimeEntryResponse>>.Failure("User not authenticated");

            var companyId = _tenantService.GetTenantId();

            var query = _unitOfWork.TimeEntries
                .Query()
                .Include(te => te.Issue)
                    .ThenInclude(i => i.Project)
                .Include(te => te.User)
                .Include(te => te.Project)
                .Where(te => te.UserId == userId && te.CompanyId == companyId);

            if (dateFrom.HasValue)
                query = query.Where(te => te.StartTime >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(te => te.StartTime < dateTo.Value.Date.AddDays(1));

            if (projectId.HasValue)
                query = query.Where(te => te.ProjectId == projectId.Value);

            if (issueId.HasValue)
                query = query.Where(te => te.IssueId == issueId.Value);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchLower = searchTerm.ToLower();
                query = query.Where(te =>
                    (te.Description != null && te.Description.ToLower().Contains(searchLower)) ||
                    (te.Issue != null && te.Issue.Title.ToLower().Contains(searchLower)) ||
                    (te.Project != null && te.Project.Name.ToLower().Contains(searchLower)));
            }

            var totalCount = await query.CountAsync();

            // Calculate total minutes for all filtered records
            // DurationMinutes is a NotMapped computed property, so we need to calculate it directly in SQL
            var totalMinutes = await query
                .Where(te => te.EndTime.HasValue)
                .SumAsync(te => (int)(te.EndTime.Value - te.StartTime).TotalMinutes);

            var entries = await query
                .OrderByDescending(te => te.StartTime)
                .Skip(pageNumber * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var responses = entries.Select(te => BuildTimeEntryResponse(te, te.Issue)).ToList();

            var paginatedResult = new PaginatedResult<TimeEntryResponse>
            {
                Items = responses,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalMinutes = totalMinutes
            };

            return Result<PaginatedResult<TimeEntryResponse>>.Success(paginatedResult);
        }

        public async Task<Result<TimeEntryResponse>> GetEntryByIdAsync(int entryId)
        {
            var userId = _tenantService.GetCurrentUserId();
            // Optimized: AsNoTracking for read-only query
            var entry = await _unitOfWork.TimeEntries
                .Query()
                .AsNoTracking()
                .Include(te => te.Issue)
                    .ThenInclude(i => i.Project)
                .Include(te => te.User)
                .FirstOrDefaultAsync(te => te.Id == entryId);

            if (entry == null)
                return Result<TimeEntryResponse>.Failure("Time entry not found");

            // Verify ownership
            if (entry.UserId != userId)
                return Result<TimeEntryResponse>.Failure("You don't have access to this entry");

            return Result<TimeEntryResponse>.Success(BuildTimeEntryResponse(entry, entry.Issue));
        }

        public async Task<Result<TimeEntryResponse>> UpdateEntryAsync(int entryId, UpdateTimeEntryRequest request)
        {
            var userId = _tenantService.GetCurrentUserId();
            var companyId = _tenantService.GetTenantId();
            // Load with tracking for update (don't use AsNoTracking here)
            var entry = await _unitOfWork.TimeEntries
                .Query()
                .FirstOrDefaultAsync(te => te.Id == entryId);

            if (entry == null)
                return Result<TimeEntryResponse>.Failure("Time entry not found");

            // Verify ownership
            if (entry.UserId != userId)
                return Result<TimeEntryResponse>.Failure("You don't have access to this entry");

            // Cannot update running timer with this endpoint
            if (entry.EndTime == null && (request.StartTime.HasValue || request.EndTime.HasValue))
                return Result<TimeEntryResponse>.Failure("Cannot update times of a running timer. Stop it first.");

            // Validate and update ProjectId and IssueId
            if (request.ProjectId.HasValue || request.IssueId.HasValue)
            {
                // At least one must be set
                if (!request.ProjectId.HasValue && !request.IssueId.HasValue)
                    return Result<TimeEntryResponse>.Failure("Either ProjectId or IssueId must be provided");

                // If IssueId is provided, validate it belongs to the user and get its project
                if (request.IssueId.HasValue)
                {
                    // Optimized: Only load needed fields for validation
                    var issueValidation = await _unitOfWork.Issues
                        .Query()
                        .AsNoTracking()
                        .Where(i => i.Id == request.IssueId.Value)
                        .Select(i => new { i.ProjectId, i.AssignedUserId, ProjectCompanyId = i.Project.CompanyId })
                        .FirstOrDefaultAsync();

                    if (issueValidation == null || issueValidation.ProjectCompanyId != companyId)
                        return Result<TimeEntryResponse>.Failure("Issue not found");

                    // Validate issue is assigned to the user
                    if (issueValidation.AssignedUserId != userId)
                        return Result<TimeEntryResponse>.Failure("You can only track time on issues assigned to you");

                    entry.IssueId = request.IssueId.Value;
                    entry.ProjectId = issueValidation.ProjectId; // Set project from issue
                }
                else if (request.ProjectId.HasValue)
                {
                    // Optimized: Only load CompanyId for validation
                    var projectCompanyId = await _unitOfWork.Projects
                        .Query()
                        .AsNoTracking()
                        .Where(p => p.Id == request.ProjectId.Value)
                        .Select(p => p.CompanyId)
                        .FirstOrDefaultAsync();

                    if (projectCompanyId == 0 || projectCompanyId != companyId)
                        return Result<TimeEntryResponse>.Failure("Project not found");

                    entry.ProjectId = request.ProjectId.Value;
                    entry.IssueId = null; // Clear issue when only project is set
                }
            }

            if (request.StartTime.HasValue)
                entry.StartTime = request.StartTime.Value;

            if (request.EndTime.HasValue)
                entry.EndTime = request.EndTime.Value;

            if (request.Description != null)
                entry.Description = request.Description;

            // Validate StartTime < EndTime
            if (entry.EndTime.HasValue && entry.StartTime >= entry.EndTime.Value)
                return Result<TimeEntryResponse>.Failure("Start time must be before end time");

            _unitOfWork.TimeEntries.Update(entry);
            await _unitOfWork.SaveChangesAsync();

            return await GetEntryByIdAsync(entryId);
        }

        public async Task<Result> DeleteEntryAsync(int entryId)
        {
            var userId = _tenantService.GetCurrentUserId();
            var entry = await _unitOfWork.TimeEntries.GetByIdAsync(entryId);

            if (entry == null)
                return Result.Failure("Time entry not found");

            // Verify ownership
            if (entry.UserId != userId)
                return Result.Failure("You don't have access to this entry");

            _unitOfWork.TimeEntries.Delete(entry);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        private TimeEntryResponse BuildTimeEntryResponse(TimeEntry entry, Issue? issue)
        {
            return new TimeEntryResponse
            {
                Id = entry.Id,
                ProjectId = entry.ProjectId ?? issue?.ProjectId,
                ProjectName = issue?.Project?.Name ?? entry.Project?.Name ?? string.Empty,
                IssueId = entry.IssueId,
                IssueTitle = issue?.Title ?? string.Empty,
                UserId = entry.UserId,
                UserName = entry.User?.Nombre ?? string.Empty,
                StartTime = entry.StartTime,
                EndTime = entry.EndTime,
                DurationMinutes = entry.DurationMinutes,
                Description = entry.Description
            };
        }
    }
}

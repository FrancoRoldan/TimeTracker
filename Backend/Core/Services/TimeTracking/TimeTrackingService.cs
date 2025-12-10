using Core.Common;
using Core.Services.Tenant;
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

            // CRITICAL: Check for active timer
            var activeTimer = await _unitOfWork.TimeEntries.FindAsync(
                te => te.UserId == userId && te.EndTime == null
            );

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
                // CRITICAL: Verify issue exists and user has access
                issue = await _unitOfWork.Issues
                    .Query()
                    .Include(i => i.Project)
                        .ThenInclude(p => p.Company)
                    .Include(i => i.AssignedUser)
                    .FirstOrDefaultAsync(i => i.Id == request.IssueId);

                if (issue == null)
                    return Result<TimeEntryResponse>.Failure("Issue not found");

                // CRITICAL: Security - Verify issue belongs to user's company
                if (issue.Project.CompanyId != companyId)
                    return Result<TimeEntryResponse>.Failure(
                        "You cannot track time on issues from other companies"
                    );

                projectId = issue.ProjectId;
            }
            else if (request.ProjectId.HasValue)
            {
                // Tracking time directly on project (no specific issue)
                var project = await _unitOfWork.Projects
                    .Query()
                    .Include(p => p.Company)
                    .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

                if (project == null)
                    return Result<TimeEntryResponse>.Failure("Project not found");

                // CRITICAL: Security - Verify project belongs to user's company
                if (project.CompanyId != companyId)
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

            var activeTimer = await _unitOfWork.TimeEntries
                .Query()
                .Include(te => te.Issue)
                    .ThenInclude(i => i.Project)
                .Include(te => te.User)
                .FirstOrDefaultAsync(te => te.UserId == userId && te.EndTime == null);

            if (activeTimer == null)
                return Result<TimeEntryResponse>.Failure("No active timer found");

            activeTimer.EndTime = DateTime.UtcNow;
            _unitOfWork.TimeEntries.Update(activeTimer);
            await _unitOfWork.SaveChangesAsync();

            return Result<TimeEntryResponse>.Success(BuildTimeEntryResponse(activeTimer, activeTimer.Issue));
        }

        public async Task<Result<TimeEntryResponse>> GetActiveTimerAsync()
        {
            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<TimeEntryResponse>.Failure("User not authenticated");

            var activeTimer = await _unitOfWork.TimeEntries
                .Query()
                .Include(te => te.Issue)
                    .ThenInclude(i => i.Project)
                .Include(te => te.User)
                .FirstOrDefaultAsync(te => te.UserId == userId && te.EndTime == null);

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

            // Verify issue access (same as StartTimer)
            var issue = await _unitOfWork.Issues
                .Query()
                .Include(i => i.Project)
                .Include(i => i.AssignedUser)
                .FirstOrDefaultAsync(i => i.Id == request.IssueId);

            if (issue == null)
                return Result<TimeEntryResponse>.Failure("Issue not found");

            var companyId = _tenantService.GetTenantId();
            if (issue.Project.CompanyId != companyId)
                return Result<TimeEntryResponse>.Failure(
                    "You cannot track time on issues from other companies"
                );

            // CRITICAL: Check for overlapping entries
            var hasOverlap = await _unitOfWork.TimeEntries
                .Query()
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
                IssueId = request.IssueId,
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

            var query = _unitOfWork.TimeEntries
                .Query()
                .Where(te => te.UserId == userId);

            if (dateFrom.HasValue)
                query = query.Where(te => te.StartTime >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(te => te.EndTime <= dateTo.Value || te.EndTime == null);

            if (projectId.HasValue)
                query = query.Where(te => te.Issue.ProjectId == projectId.Value);

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

        public async Task<Result<TimeEntryResponse>> GetEntryByIdAsync(int entryId)
        {
            var userId = _tenantService.GetCurrentUserId();
            var entry = await _unitOfWork.TimeEntries
                .Query()
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
            var entry = await _unitOfWork.TimeEntries
                .Query()
                .Include(te => te.Issue)
                .FirstOrDefaultAsync(te => te.Id == entryId);

            if (entry == null)
                return Result<TimeEntryResponse>.Failure("Time entry not found");

            // Verify ownership
            if (entry.UserId != userId)
                return Result<TimeEntryResponse>.Failure("You don't have access to this entry");

            // Cannot update running timer with this endpoint
            if (entry.EndTime == null && (request.StartTime.HasValue || request.EndTime.HasValue))
                return Result<TimeEntryResponse>.Failure("Cannot update times of a running timer. Stop it first.");

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

        private TimeEntryResponse BuildTimeEntryResponse(TimeEntry entry, Issue issue)
        {
            return new TimeEntryResponse
            {
                Id = entry.Id,
                IssueId = entry.IssueId ?? 0,
                IssueTitle = issue.Title,
                ProjectName = issue.Project?.Name ?? string.Empty,
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

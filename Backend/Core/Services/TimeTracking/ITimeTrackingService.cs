using Core.Common;
using Data.Dtos;
using Data.Dtos.TimeEntry;

namespace Core.Services.TimeTracking
{
    public interface ITimeTrackingService
    {
        Task<Result<TimeEntryResponse>> StartTimerAsync(StartTimerRequest request);
        Task<Result<TimeEntryResponse>> StopTimerAsync();
        Task<Result<TimeEntryResponse>> GetActiveTimerAsync();
        Task<Result<TimeEntryResponse>> AddManualEntryAsync(AddManualEntryRequest request);
        Task<Result<List<TimeEntryResponse>>> GetUserEntriesAsync(
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? projectId = null,
            int? issueId = null);
        Task<Result<PaginatedResult<TimeEntryResponse>>> GetUserEntriesPaginatedAsync(
            int pageNumber = 0,
            int pageSize = 10,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? projectId = null,
            int? issueId = null,
            string? searchTerm = null);
        Task<Result<TimeEntryResponse>> GetEntryByIdAsync(int entryId);
        Task<Result<TimeEntryResponse>> UpdateEntryAsync(int entryId, UpdateTimeEntryRequest request);
        Task<Result> DeleteEntryAsync(int entryId);
    }
}

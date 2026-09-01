using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Data.Models
{
    public class TimeEntry : BaseEntity
    {
        // Either IssueId or ProjectId must be set (can track time on project without specific issue)
        public int? IssueId { get; set; }
        public Issue? Issue { get; set; }

        public int? ProjectId { get; set; }
        public Project? Project { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int CompanyId { get; set; }
        public Company Company { get; set; } = null!;

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public bool RegisteredInDevOps { get; set; }

        // Computed property (not mapped to DB)
        [NotMapped]
        public int? DurationMinutes => EndTime.HasValue
            ? (int)(EndTime.Value - StartTime).TotalMinutes
            : null;
    }
}

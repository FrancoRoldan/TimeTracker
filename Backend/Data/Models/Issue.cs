using Data.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Data.Models
{
    public class Issue : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project Project { get; set; } = null!;

        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        public IssueType Type { get; set; }
        public IssueStatus Status { get; set; } = IssueStatus.ToDo;
        public IssuePriority Priority { get; set; } = IssuePriority.Medium;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? EstimatedHours { get; set; }

        public int? AssignedUserId { get; set; }
        public User? AssignedUser { get; set; }

        // Navigation properties
        public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    }
}

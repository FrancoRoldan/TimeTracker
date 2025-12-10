using Data.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Data.Models
{
    public class Project : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public ProjectStatus Status { get; set; } = ProjectStatus.Active;

        [Column("CompanyId")]
        public new int CompanyId { get; set; }
        public Company Company { get; set; } = null!;

        // Navigation properties
        public ICollection<Issue> Issues { get; set; } = new List<Issue>();
    }
}

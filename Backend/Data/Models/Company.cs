using System.ComponentModel.DataAnnotations;

namespace Data.Models
{
    public class Company : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<UserCompany> UserCompanies { get; set; } = new List<UserCompany>();
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}

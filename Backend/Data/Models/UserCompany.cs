using Data.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Data.Models
{
    public class UserCompany : BaseEntity
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Column("CompanyId")]
        public new int CompanyId { get; set; }
        public Company Company { get; set; } = null!;

        public UserRole Role { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? HourlyRate { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace Data.Models
{
    public class User : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        // Navigation properties
        public ICollection<UserCompany> UserCompanies { get; set; } = new List<UserCompany>();
    }
}

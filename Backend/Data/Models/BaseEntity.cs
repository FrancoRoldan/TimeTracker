
namespace Data.Models
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        public int? CompanyId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public bool IsDeleted { get; set; }
    }
}

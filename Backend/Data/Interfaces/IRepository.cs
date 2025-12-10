using Data.Models;
using System.Linq.Expressions;

namespace Data.Interfaces
{
    public interface IRepository<T> where T : BaseEntity
    {
        // Query methods
        Task<IEnumerable<T>> GetAllAsync();
        Task<T?> GetByIdAsync(int id);
        IQueryable<T> Query();
        Task<T?> FindAsync(Expression<Func<T, bool>> predicate);
        Task<IEnumerable<T>> FindAllAsync(Expression<Func<T, bool>> predicate);

        // Command methods (no auto-save, requires UnitOfWork.SaveChangesAsync)
        Task<T> AddAsync(T entity);
        void Update(T entity);
        void Delete(T entity);
        Task DeleteAsync(int id);

        // Bulk operations
        Task AddRangeAsync(IEnumerable<T> entities);
        void UpdateRange(IEnumerable<T> entities);
        void DeleteRange(IEnumerable<T> entities);
    }
}

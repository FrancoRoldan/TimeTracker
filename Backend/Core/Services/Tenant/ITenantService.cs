namespace Core.Services.Tenant
{
    public interface ITenantService
    {
        int? GetTenantId();
        int? GetCurrentUserId();
        string GetCurrentUserEmail();
    }
}

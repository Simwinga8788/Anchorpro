namespace AnchorPro.Services.Interfaces
{
    public interface ICurrentTenantService
    {
        int? TenantId { get; set; }
        bool IsSet { get; }
        Task InitializeAsync();
    }
}


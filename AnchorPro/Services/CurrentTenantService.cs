using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AnchorPro.Services
{
    public class CurrentTenantService : ICurrentTenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private int? _cachedTenantId;
        private const string IMPERSONATION_COOKIE = "ImpersonatedTenantId"; // Unused now

        public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? TenantId 
        { 
            get => _cachedTenantId;
            set => _cachedTenantId = value;
        }

        public bool IsSet => TenantId.HasValue;

        public Task InitializeAsync()
        {
            // Initialization now happens via TenantCircuitHandler usually
            return Task.CompletedTask;
        }
    }
}



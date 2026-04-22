using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.JSInterop;

namespace AnchorPro.Services
{
    public class CurrentTenantService : ICurrentTenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IJSRuntime _jsRuntime;
        private int? _cachedTenantId;
        private const string IMPERSONATION_COOKIE = "ImpersonatedTenantId"; // Unused now

        public CurrentTenantService(IHttpContextAccessor httpContextAccessor, IJSRuntime jsRuntime)
        {
            _httpContextAccessor = httpContextAccessor;
            _jsRuntime = jsRuntime;
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



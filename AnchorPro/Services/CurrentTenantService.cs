using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace AnchorPro.Services
{
    public class CurrentTenantService : ICurrentTenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private int? _cachedTenantId;

        public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? TenantId 
        { 
            get
            {
                if (_cachedTenantId.HasValue) return _cachedTenantId;
                
                var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId");
                if (claim != null && int.TryParse(claim.Value, out var tenantId))
                {
                    _cachedTenantId = tenantId;
                    return tenantId;
                }
                return null;
            }
            set => _cachedTenantId = value;
        }

        public bool IsSet => TenantId.HasValue;

        public Task InitializeAsync()
        {
            return Task.CompletedTask;
        }
    }
}



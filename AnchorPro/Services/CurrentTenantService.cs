using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace AnchorPro.Services
{
    public class CurrentTenantService : ICurrentTenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private int? _overrideTenantId;

        public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? TenantId
        {
            get
            {
                // Explicit override (e.g. impersonation) takes priority
                if (_overrideTenantId.HasValue) return _overrideTenantId;

                // Otherwise read from the authenticated user's claims on the current request
                var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId");
                if (claim != null && int.TryParse(claim.Value, out var id))
                    return id;

                return null;
            }
            set => _overrideTenantId = value;
        }

        public bool IsSet => TenantId.HasValue;

        public Task InitializeAsync() => Task.CompletedTask;
    }
}



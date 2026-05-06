using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server.Circuits;
using System.Security.Claims;

namespace AnchorPro.Services
{
    public class TenantCircuitHandler : CircuitHandler
    {
        private readonly AuthenticationStateProvider _authStateProvider;
        private readonly ICurrentTenantService _tenantService;

        public TenantCircuitHandler(AuthenticationStateProvider authStateProvider, ICurrentTenantService tenantService)
        {
            _authStateProvider = authStateProvider;
            _tenantService = tenantService;
        }

        public override async Task OnCircuitOpenedAsync(Circuit circuit, CancellationToken cancellationToken)
        {
            var authState = await _authStateProvider.GetAuthenticationStateAsync();
            var user = authState.User;

            if (user.Identity?.IsAuthenticated == true)
            {
                var tenantClaim = user.FindFirst("TenantId");
                if (tenantClaim != null && int.TryParse(tenantClaim.Value, out int tenantId))
                {
                    _tenantService.TenantId = tenantId;
                }
            }

            await base.OnCircuitOpenedAsync(circuit, cancellationToken);
        }
    }
}

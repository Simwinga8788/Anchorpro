using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Platform Owner tenant management — create, read, and deactivate tenants.
    /// ALL endpoints restricted to PlatformOwner (TenantId == null + Admin role).
    /// </summary>
    [Route("api/tenants")]
    [ApiController]
    [Authorize]
    public class TenantsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ISubscriptionService _subscriptionService;

        public TenantsController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ISubscriptionService subscriptionService)
        {
            _context = context;
            _userManager = userManager;
            _subscriptionService = subscriptionService;
        }

        private async Task<bool> IsPlatformOwnerAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null || user.TenantId != null) return false;
            var roles = await _userManager.GetRolesAsync(user);
            return roles.Contains("Admin");
        }

        // ── LIST / GET ────────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/tenants — All tenants on the platform.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            if (!await IsPlatformOwnerAsync())
                return StatusCode(403, new { message = "Platform Owner access required." });

            _context.IgnoreTenantFilter = true;
            var tenants = await _context.Tenants
                .OrderBy(t => t.Name)
                .ToListAsync();

            return Ok(tenants);
        }

        /// <summary>
        /// GET /api/tenants/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            if (!await IsPlatformOwnerAsync())
                return StatusCode(403, new { message = "Platform Owner access required." });

            _context.IgnoreTenantFilter = true;
            var tenant = await _context.Tenants.FindAsync(id);
            return tenant == null ? NotFound() : Ok(tenant);
        }

        /// <summary>
        /// GET /api/tenants/{id}/users — All users belonging to a tenant.
        /// </summary>
        [HttpGet("{id}/users")]
        public async Task<ActionResult> GetTenantUsers(int id)
        {
            if (!await IsPlatformOwnerAsync())
                return StatusCode(403, new { message = "Platform Owner access required." });

            var users = _userManager.Users
                .Where(u => u.TenantId == id)
                .OrderBy(u => u.CreatedAt)
                .Select(u => new { u.Id, u.Email, u.FirstName, u.LastName, u.CreatedAt })
                .ToList();

            return Ok(users);
        }

        // ── CREATE / UPDATE ───────────────────────────────────────────────────

        /// <summary>
        /// POST /api/tenants — Create a new tenant.
        /// Body: { "name": "CBFM Zambia", "contactEmail": "admin@cbfm.zm", "contactPhone": "+260..." }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Tenant tenant)
        {
            if (!await IsPlatformOwnerAsync())
                return StatusCode(403, new { message = "Platform Owner access required." });

            tenant.CreatedAt = DateTime.UtcNow;
            tenant.CreatedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = tenant.Id }, tenant);
        }

        /// <summary>
        /// PUT /api/tenants/{id} — Update tenant contact details.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Tenant tenant)
        {
            if (!await IsPlatformOwnerAsync())
                return StatusCode(403, new { message = "Platform Owner access required." });

            if (id != tenant.Id) return BadRequest("ID mismatch.");

            _context.IgnoreTenantFilter = true;
            var existing = await _context.Tenants.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = tenant.Name;
            existing.Address = tenant.Address;
            existing.ContactEmail = tenant.ContactEmail;
            existing.ContactPhone = tenant.ContactPhone;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// PATCH /api/tenants/{id}/deactivate — Soft-deactivate a tenant.
        /// </summary>
        [HttpPatch("{id}/deactivate")]
        public async Task<ActionResult> Deactivate(int id)
        {
            if (!await IsPlatformOwnerAsync())
                return StatusCode(403, new { message = "Platform Owner access required." });

            _context.IgnoreTenantFilter = true;
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            tenant.IsActive = false;
            tenant.UpdatedAt = DateTime.UtcNow;
            tenant.UpdatedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Tenant '{tenant.Name}' deactivated." });
        }

        /// <summary>
        /// PATCH /api/tenants/{id}/activate — Re-activate a previously deactivated tenant.
        /// </summary>
        [HttpPatch("{id}/activate")]
        public async Task<ActionResult> Activate(int id)
        {
            if (!await IsPlatformOwnerAsync())
                return StatusCode(403, new { message = "Platform Owner access required." });

            _context.IgnoreTenantFilter = true;
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            tenant.IsActive = true;
            tenant.UpdatedAt = DateTime.UtcNow;
            tenant.UpdatedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Tenant '{tenant.Name}' activated." });
        }

        /// <summary>
        /// POST /api/tenants/{id}/assign-plan
        /// Assigns a subscription plan to a tenant, creating a TenantSubscription record.
        /// This must be called after tenant creation to enable feature flags and billing.
        /// Body: { "planId": 2, "isTrial": true }
        /// </summary>
        [HttpPost("{id}/assign-plan")]
        public async Task<ActionResult> AssignPlan(int id, [FromBody] AssignPlanRequest req)
        {
            if (!await IsPlatformOwnerAsync())
                return StatusCode(403, new { message = "Platform Owner access required." });

            _context.IgnoreTenantFilter = true;
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound(new { message = $"Tenant {id} not found." });

            var plan = await _context.SubscriptionPlans.FindAsync(req.PlanId);
            if (plan == null) return NotFound(new { message = $"Plan {req.PlanId} not found." });

            // Cancel any existing active subscription
            var existing = await _context.TenantSubscriptions
                .Where(s => s.TenantId == id && s.Status == "Active")
                .FirstOrDefaultAsync();
            if (existing != null)
            {
                existing.Status = "Cancelled";
                existing.CancelledAt = DateTime.UtcNow;
            }

            var now = DateTime.UtcNow;

            var subscription = new TenantSubscription
            {
                TenantId = id,
                SubscriptionPlanId = req.PlanId,
                Status = req.IsTrial ? "Trial" : "Active",
                IsTrial = req.IsTrial,
                StartDate = now,
                NextBillingDate = now.AddMonths(1),
                TrialEndDate = req.IsTrial ? now.AddDays(30) : null,
                CreatedAt = now,
                CreatedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User"
            };

            _context.TenantSubscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Plan '{plan.Name}' assigned to tenant '{tenant.Name}'.",
                subscriptionId = subscription.Id,
                isTrial = req.IsTrial,
                trialEndsAt = subscription.TrialEndDate
            });
        }
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public class AssignPlanRequest
    {
        public int PlanId { get; set; }
        public bool IsTrial { get; set; } = false;
    }
}

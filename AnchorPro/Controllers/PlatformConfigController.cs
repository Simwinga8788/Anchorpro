using AnchorPro.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/platform-config")]
    [ApiController]
    [Authorize(Roles = "PlatformOwner,PlatformAdmin")]
    public class PlatformConfigController : ControllerBase
    {
        private readonly PlatformConfigService _cfg;

        public PlatformConfigController(PlatformConfigService cfg) => _cfg = cfg;

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(new
            {
                stripe = new
                {
                    publishableKey = await _cfg.GetAsync("Stripe:PublishableKey"),
                    secretKey      = await _cfg.GetMaskedAsync("Stripe:SecretKey"),
                    webhookSecret  = await _cfg.GetMaskedAsync("Stripe:WebhookSecret"),
                },
                smtp = new
                {
                    host      = await _cfg.GetAsync("Smtp:Host"),
                    port      = await _cfg.GetAsync("Smtp:Port"),
                    username  = await _cfg.GetAsync("Smtp:Username"),
                    password  = await _cfg.GetMaskedAsync("Smtp:Password"),
                    fromName  = await _cfg.GetAsync("Smtp:FromName"),
                    fromEmail = await _cfg.GetAsync("Smtp:FromEmail"),
                },
                app = new
                {
                    name   = await _cfg.GetAsync("App:Name"),
                    appUrl = await _cfg.GetAsync("App:Url"),
                }
            });
        }

        [HttpPatch("stripe")]
        public async Task<IActionResult> PatchStripe([FromBody] StripeDto dto)
        {
            if (dto.PublishableKey != null)
                await _cfg.SetAsync("Stripe:PublishableKey", dto.PublishableKey, "Stripe");
            if (dto.SecretKey != null && dto.SecretKey != "••••••••")
                await _cfg.SetAsync("Stripe:SecretKey", dto.SecretKey, "Stripe");
            if (dto.WebhookSecret != null && dto.WebhookSecret != "••••••••")
                await _cfg.SetAsync("Stripe:WebhookSecret", dto.WebhookSecret, "Stripe");
            return Ok(new { message = "Stripe config saved." });
        }

        [HttpPatch("smtp")]
        public async Task<IActionResult> PatchSmtp([FromBody] SmtpDto dto)
        {
            if (dto.Host     != null) await _cfg.SetAsync("Smtp:Host",      dto.Host,      "Smtp");
            if (dto.Port     != null) await _cfg.SetAsync("Smtp:Port",      dto.Port,      "Smtp");
            if (dto.Username != null) await _cfg.SetAsync("Smtp:Username",  dto.Username,  "Smtp");
            if (dto.Password != null && dto.Password != "••••••••")
                await _cfg.SetAsync("Smtp:Password", dto.Password, "Smtp");
            if (dto.FromName  != null) await _cfg.SetAsync("Smtp:FromName",  dto.FromName,  "Smtp");
            if (dto.FromEmail != null) await _cfg.SetAsync("Smtp:FromEmail", dto.FromEmail, "Smtp");
            return Ok(new { message = "SMTP config saved." });
        }

        [HttpPatch("app")]
        public async Task<IActionResult> PatchApp([FromBody] AppDto dto)
        {
            if (dto.Name   != null) await _cfg.SetAsync("App:Name", dto.Name,   "App");
            if (dto.AppUrl != null) await _cfg.SetAsync("App:Url",  dto.AppUrl, "App");
            return Ok(new { message = "App config saved." });
        }

        public record StripeDto(string? PublishableKey, string? SecretKey, string? WebhookSecret);
        public record SmtpDto(string? Host, string? Port, string? Username, string? Password, string? FromName, string? FromEmail);
        public record AppDto(string? Name, string? AppUrl);
    }
}

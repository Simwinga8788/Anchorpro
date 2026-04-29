using AnchorPro.Services;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace AnchorPro.Services
{
    public class StripeService
    {
        private readonly IConfiguration _config;
        private readonly PlatformConfigService _platformConfig;

        public StripeService(IConfiguration config, PlatformConfigService platformConfig)
        {
            _config = config;
            _platformConfig = platformConfig;
        }

        private async Task<string?> GetSecretKeyAsync()
            => await _platformConfig.GetAsync("Stripe:SecretKey") ?? _config["Stripe:SecretKey"];

        private async Task<string?> GetWebhookSecretAsync()
            => await _platformConfig.GetAsync("Stripe:WebhookSecret") ?? _config["Stripe:WebhookSecret"];

        public async Task<bool> IsConfiguredAsync()
        {
            var key = await GetSecretKeyAsync();
            return !string.IsNullOrEmpty(key);
        }

        private async Task<T> WithKeyAsync<T>(Func<Task<T>> fn)
        {
            var key = await GetSecretKeyAsync();
            StripeConfiguration.ApiKey = key ?? "";
            return await fn();
        }

        public async Task<string> CreateCheckoutSessionAsync(string tenantId, string planId, string successUrl, string cancelUrl)
        {
            return await WithKeyAsync(async () =>
            {
                var options = new SessionCreateOptions
                {
                    Mode = "subscription",
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions { Price = planId, Quantity = 1 }
                    },
                    SuccessUrl = successUrl,
                    CancelUrl = cancelUrl,
                    Metadata = new Dictionary<string, string> { { "tenantId", tenantId } }
                };
                var service = new SessionService();
                var session = await service.CreateAsync(options);
                return session.Url;
            });
        }

        public async Task<string> CreatePortalSessionAsync(string customerId, string returnUrl)
        {
            return await WithKeyAsync(async () =>
            {
                var options = new Stripe.BillingPortal.SessionCreateOptions
                {
                    Customer = customerId,
                    ReturnUrl = returnUrl,
                };
                var service = new Stripe.BillingPortal.SessionService();
                var session = await service.CreateAsync(options);
                return session.Url;
            });
        }

        public async Task<Stripe.Subscription?> GetSubscriptionAsync(string subscriptionId)
        {
            return await WithKeyAsync(async () =>
            {
                var service = new SubscriptionService();
                return await service.GetAsync(subscriptionId);
            });
        }

        public async Task<string?> GetWebhookSecretForValidation()
            => await GetWebhookSecretAsync();
    }
}

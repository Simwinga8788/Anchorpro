using Xunit;
using Moq;
using AnchorPro.Services;
using AnchorPro.Services.Interfaces;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AnchorPro.Tests.Services
{
    public class SubscriptionServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly SubscriptionService _service;

        public SubscriptionServiceTests()
        {
            // Setup in-memory database for testing
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _service = new SubscriptionService(_context);

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            // Add subscription plans
            var plans = new List<SubscriptionPlan>
            {
                new SubscriptionPlan
                {
                    Id = 1,
                    Name = "Free Trial",
                    Description = "14-day trial",
                    MonthlyPrice = 0,
                    AnnualPrice = 0,
                    Currency = "ZMW",
                    MaxTechnicians = 2,
                    MaxEquipment = 5,
                    MaxActiveJobs = 10,
                    StorageLimitMB = 100,
                    AllowExports = false,
                    AllowPredictiveEngine = false,
                    AllowMobileAccess = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new SubscriptionPlan
                {
                    Id = 2,
                    Name = "Professional",
                    Description = "For growing teams",
                    MonthlyPrice = 2500,
                    AnnualPrice = 25000,
                    Currency = "ZMW",
                    MaxTechnicians = 10,
                    MaxEquipment = 50,
                    MaxActiveJobs = 100,
                    StorageLimitMB = 5120,
                    AllowExports = true,
                    AllowPredictiveEngine = false,
                    AllowMobileAccess = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                }
            };

            _context.SubscriptionPlans.AddRange(plans);

            // Add tenant subscription
            var subscription = new TenantSubscription
            {
                Id = 1,
                TenantId = "default",
                SubscriptionPlanId = 1,
                Status = "Trial",
                StartDate = DateTime.UtcNow,
                TrialEndDate = DateTime.UtcNow.AddDays(14),
                IsTrial = true,
                AutoRenew = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System"
            };

            _context.TenantSubscriptions.Add(subscription);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetCurrentSubscriptionAsync_ReturnsSubscription()
        {
            // Act
            var result = await _service.GetCurrentSubscriptionAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal("default", result.TenantId);
            Assert.Equal("Trial", result.Status);
            Assert.True(result.IsTrial);
        }

        [Fact]
        public async Task GetCurrentPlanAsync_ReturnsPlan()
        {
            // Act
            var result = await _service.GetCurrentPlanAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Free Trial", result.Name);
            Assert.Equal(5, result.MaxEquipment);
        }

        [Fact]
        public async Task GetAllPlansAsync_ReturnsAllActivePlans()
        {
            // Act
            var result = await _service.GetAllPlansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.All(result, plan => Assert.True(plan.IsActive));
        }

        [Fact]
        public async Task CheckLimitAsync_Equipment_WithinLimit_ReturnsTrue()
        {
            // Arrange
            int currentCount = 3; // Less than Free Trial limit of 5

            // Act
            var result = await _service.CheckLimitAsync("equipment", currentCount);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task CheckLimitAsync_Equipment_ExceedsLimit_ReturnsFalse()
        {
            // Arrange
            int currentCount = 5; // At Free Trial limit of 5

            // Act
            var result = await _service.CheckLimitAsync("equipment", currentCount);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IsFeatureEnabledAsync_MobileAccess_ReturnsTrue()
        {
            // Act
            var result = await _service.IsFeatureEnabledAsync("mobile");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IsFeatureEnabledAsync_Exports_ReturnsFalse()
        {
            // Act
            var result = await _service.IsFeatureEnabledAsync("exports");

            // Assert
            Assert.False(result); // Free Trial doesn't allow exports
        }

        [Fact]
        public async Task IsTrialExpiredAsync_ActiveTrial_ReturnsFalse()
        {
            // Act
            var result = await _service.IsTrialExpiredAsync();

            // Assert
            Assert.False(result); // Trial just started, not expired
        }

        [Fact]
        public async Task GetDaysRemainingAsync_ReturnsDaysLeft()
        {
            // Act
            var result = await _service.GetDaysRemainingAsync();

            // Assert
            Assert.True(result > 0 && result <= 14);
        }

        [Fact]
        public async Task UpgradeSubscriptionAsync_ValidUpgrade_ReturnsTrue()
        {
            // Arrange
            int newPlanId = 2; // Professional plan
            string userId = "test-user";

            // Act
            var result = await _service.UpgradeSubscriptionAsync("default", newPlanId, userId);

            // Assert
            Assert.True(result);

            // Verify subscription was updated
            var subscription = await _service.GetCurrentSubscriptionAsync();
            Assert.Equal(2, subscription.SubscriptionPlanId);
            Assert.Equal("Active", subscription.Status);
            Assert.False(subscription.IsTrial);
        }

        [Fact]
        public async Task UpgradeSubscriptionAsync_InvalidPlan_ReturnsFalse()
        {
            // Arrange
            int invalidPlanId = 999;
            string userId = "test-user";

            // Act
            var result = await _service.UpgradeSubscriptionAsync("default", invalidPlanId, userId);

            // Assert
            Assert.False(result);
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}

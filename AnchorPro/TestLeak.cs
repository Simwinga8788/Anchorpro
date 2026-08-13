using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace AnchorPro.Tests
{
    public class Program
    {
        public static void Main()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql("Host=localhost;Database=anchorpro;Username=postgres;Password=postgres"));
            services.AddSingleton<ICurrentTenantService, MockTenantService>();
            var provider = services.BuildServiceProvider();
            
            var context = provider.GetRequiredService<ApplicationDbContext>();
            
            // Check without filters
            context.IgnoreTenantFilter = true;
            var allTools = context.Tools.ToList();
            Console.WriteLine($"Total Tools in DB: {allTools.Count}");
            foreach(var t in allTools) {
                Console.WriteLine($"- ID: {t.Id}, Name: {t.Name}, TenantId: {t.TenantId}");
            }
            
            // Turn filters back on and mock as Tenant 3
            context.IgnoreTenantFilter = false;
            var tenantService = (MockTenantService)provider.GetRequiredService<ICurrentTenantService>();
            tenantService.TenantId = 3;
            
            // This requires a new context instance to pick up the tenant id since it's injected
            var context2 = provider.GetRequiredService<ApplicationDbContext>();
            
            var t3Tools = context2.Tools.ToList();
            Console.WriteLine($"\nTools visible to Tenant 3:");
            foreach(var t in t3Tools) {
                Console.WriteLine($"- ID: {t.Id}, Name: {t.Name}, TenantId: {t.TenantId}");
            }
            
            // Mock as Platform Owner (Tenant null)
            tenantService.TenantId = null;
            var context3 = provider.GetRequiredService<ApplicationDbContext>();
            var poTools = context3.Tools.ToList();
            Console.WriteLine($"\nTools visible to Platform Owner (Tenant null):");
            foreach(var t in poTools) {
                Console.WriteLine($"- ID: {t.Id}, Name: {t.Name}, TenantId: {t.TenantId}");
            }
            
            // Also print users
            context.IgnoreTenantFilter = true;
            var felix = context.Users.FirstOrDefault(u => u.FirstName == "Felix");
            if (felix != null) {
                Console.WriteLine($"\nFelix TenantId: {felix.TenantId}");
            }
        }
    }
    
    public class MockTenantService : ICurrentTenantService
    {
        public int? TenantId { get; set; } = null;
        public bool IsSet => TenantId.HasValue;
        public System.Threading.Tasks.Task InitializeAsync() => System.Threading.Tasks.Task.CompletedTask;
    }
}

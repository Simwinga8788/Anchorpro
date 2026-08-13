using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;

class Program
{
    static void Main()
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql("Host=localhost;Database=anchorpro;Username=postgres;Password=postgres"));
        
        // Mock tenant service
        services.AddSingleton<ICurrentTenantService, MockTenantService>();
        
        var provider = services.BuildServiceProvider();
        var context = provider.GetRequiredService<ApplicationDbContext>();
        
        context.IgnoreTenantFilter = true;
        
        var tools = context.Tools.ToList();
        Console.WriteLine($"Found {tools.Count} tools total.");
        foreach(var t in tools)
        {
            Console.WriteLine($"Tool: {t.Name}, TenantId: {t.TenantId}");
        }

        var users = context.Users.Where(u => u.FirstName == "Felix").ToList();
        foreach(var u in users)
        {
            Console.WriteLine($"User: {u.FirstName} {u.LastName}, TenantId: {u.TenantId}");
        }
    }
}

class MockTenantService : ICurrentTenantService
{
    public int? TenantId { get; set; } = null;
    public bool IsSet => false;
    public System.Threading.Tasks.Task InitializeAsync() => System.Threading.Tasks.Task.CompletedTask;
}

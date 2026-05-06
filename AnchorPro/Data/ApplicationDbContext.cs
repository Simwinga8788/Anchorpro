using System.Reflection;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICurrentTenantService tenantService) : IdentityDbContext<ApplicationUser>(options)
{
    public int? CurrentTenantId { get; } = tenantService.TenantId;
    public bool IgnoreTenantFilter { get; set; }

    public DbSet<Entities.Equipment> Equipment { get; set; }
    public DbSet<Entities.JobType> JobTypes { get; set; }
    public DbSet<Entities.DowntimeCategory> DowntimeCategories { get; set; }
    public DbSet<Entities.JobCard> JobCards { get; set; }
    public DbSet<Entities.JobTask> JobTasks { get; set; }
    public DbSet<Entities.DowntimeEntry> DowntimeEntries { get; set; }
    public DbSet<Entities.InventoryItem> InventoryItems { get; set; }
    public DbSet<Entities.JobCardPart> JobCardParts { get; set; }
    public DbSet<Entities.JobAttachment> JobAttachments { get; set; }
    public DbSet<Entities.PermitToWork> PermitsToWork { get; set; }
    public DbSet<Entities.Customer> Customers { get; set; }
    public DbSet<Entities.SystemSetting> SystemSettings { get; set; }
    
    // Mini-ERP Layers
    public DbSet<Department> Departments { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoicePayment> InvoicePayments { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
    public DbSet<Contract> Contracts { get; set; }

    // Platform/System Level
    public DbSet<Entities.Tenant> Tenants { get; set; }
    public DbSet<Entities.SubscriptionPlan> SubscriptionPlans { get; set; }
    public DbSet<Entities.TenantSubscription> TenantSubscriptions { get; set; }
    public DbSet<Entities.SystemAuditLog> SystemAuditLogs { get; set; }
    public DbSet<Entities.PaymentTransaction> PaymentTransactions { get; set; }
    public DbSet<Entities.ReportDefinition> ReportDefinitions { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder); // Must call base for Identity

        // Map PaymentTransaction to existing 'Payments' table
        builder.Entity<PaymentTransaction>().ToTable("Payments");

        // Fix for "Column 'Id' in table 'AspNetRoles' is of a type that is invalid for use as a key column in an index"
        builder.Entity<ApplicationUser>(entity => entity.Property(m => m.Id).HasMaxLength(85));
        builder.Entity<IdentityRole>(entity => entity.Property(m => m.Id).HasMaxLength(85));
        builder.Entity<IdentityUserClaim<string>>(entity => entity.Property(m => m.Id).HasMaxLength(85));
        builder.Entity<IdentityRoleClaim<string>>(entity => entity.Property(m => m.Id).HasMaxLength(85));
        builder.Entity<IdentityUserLogin<string>>(entity => entity.Property(m => m.LoginProvider).HasMaxLength(85));
        builder.Entity<IdentityUserLogin<string>>(entity => entity.Property(m => m.ProviderKey).HasMaxLength(85));
        builder.Entity<IdentityUserToken<string>>(entity => entity.Property(m => m.LoginProvider).HasMaxLength(85));
        builder.Entity<IdentityUserToken<string>>(entity => entity.Property(m => m.Name).HasMaxLength(85));

        // Fix Decimal Precision Warnings
        builder.Entity<ApplicationUser>().Property(e => e.HourlyRate).HasPrecision(18, 2);
        builder.Entity<SubscriptionPlan>().Property(e => e.MonthlyPrice).HasPrecision(18, 2);
        builder.Entity<SubscriptionPlan>().Property(e => e.AnnualPrice).HasPrecision(18, 2);

        // Global Query Filter for Multi-Tenancy
        // 1. ApplicationUser - REMOVED to allow Login
        // builder.Entity<ApplicationUser>().HasQueryFilter(e => IgnoreTenantFilter || !e.TenantId.HasValue || e.TenantId == CurrentTenantId);

        // 2. All BaseEntity derivatives
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                 // Use reflection to invoke 'SetTenantFilter<T>'
                 var method = typeof(ApplicationDbContext)
                     .GetMethod(nameof(SetTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)
                     ?.MakeGenericMethod(entityType.ClrType);
                 
                 method?.Invoke(this, new object[] { builder });
            }
        }

        // SystemSetting Configuration
        builder.Entity<SystemSetting>().HasQueryFilter(s => IgnoreTenantFilter || s.TenantId == CurrentTenantId);
        builder.Entity<SystemSetting>().HasIndex(s => new { s.TenantId, s.Key }).IsUnique();
    }

    private void SetTenantFilter<T>(ModelBuilder builder) where T : BaseEntity
    {
        builder.Entity<T>().HasQueryFilter(e => IgnoreTenantFilter || !e.TenantId.HasValue || e.TenantId == CurrentTenantId);
    }
}

using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AnchorPro.Data;
using AnchorPro.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var allowedOrigins = new string[]
{
    "http://localhost:5173",
    "http://localhost:3000",
    "https://anchorpro-web.vercel.app",
    "https://anchorpro.vercel.app",
    "https://anchor-pro-app.vercel.app",
};

// Merge with any additional origins from configuration
var configOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
if (configOrigins != null)
{
    var merged = new System.Collections.Generic.List<string>(allowedOrigins);
    foreach (var o in configOrigins) { if (!merged.Contains(o)) merged.Add(o); }
    allowedOrigins = merged.ToArray();
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Needed for cookie-based auth
    });
});

builder.Services.AddHttpContextAccessor(); // For cookie-based impersonation
builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = IdentityConstants.ApplicationScheme;
        options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
    })
    .AddIdentityCookies();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContextFactory<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions => npgsqlOptions.CommandTimeout(180)), ServiceLifetime.Scoped);
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddIdentityCore<ApplicationUser>(options =>
    {
        options.SignIn.RequireConfirmedAccount = true;
        // Relax password requirements for development convenience
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;
    })
    .AddRoles<IdentityRole>() // Add Roles service MUST be before EF Stores to register RoleStore
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

builder.Services.AddAuthorization(options =>
{
    // Regular Admin Policy (Already implicit via Roles attribute, but good to have)
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));

    // Strict Platform Owner Policy
    // Must be Admin AND must NOT have a TenantId claim
    options.AddPolicy("PlatformOwner", policy => 
        policy.RequireRole("Admin")
              .RequireAssertion(context => !context.User.HasClaim(c => c.Type == "TenantId")));
});

// Return 401/403 for API routes instead of redirecting to /Account/Login
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddScoped<IUserClaimsPrincipalFactory<ApplicationUser>, AnchorUserClaimsPrincipalFactory>();
// Domain Services
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IEquipmentService, AnchorPro.Services.EquipmentService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IJobCardService, AnchorPro.Services.JobCardService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IJobTaskService, AnchorPro.Services.JobTaskService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IReferenceDataService, AnchorPro.Services.ReferenceDataService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IDowntimeService, AnchorPro.Services.DowntimeService>();
    builder.Services.AddScoped<AnchorPro.Services.Interfaces.IReportingService, AnchorPro.Services.ReportingService>();
    builder.Services.AddHostedService<AnchorPro.Services.ReportingWorker>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IDashboardService, AnchorPro.Services.DashboardService>();
builder.Services.AddScoped<IDemoDataService, DemoDataService>(); // Demo Data Generator
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IInventoryService, AnchorPro.Services.InventoryService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IFileService, AnchorPro.Services.LocalFileService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IEmailService, AnchorPro.Services.SmtpEmailService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IExportService, AnchorPro.Services.CsvExportService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.ISettingsService, AnchorPro.Services.SettingsService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.ISubscriptionService, AnchorPro.Services.SubscriptionService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.ISubscriptionLifecycleService, AnchorPro.Services.SubscriptionLifecycleService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IAlertService, AnchorPro.Services.AlertService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.ICurrentTenantService, AnchorPro.Services.CurrentTenantService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.ICustomerService, AnchorPro.Services.CustomerService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.ISafetyService, AnchorPro.Services.SafetyService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IIntelligenceService, AnchorPro.Services.IntelligenceService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IFinancialService, AnchorPro.Services.FinancialService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IOrgService, AnchorPro.Services.OrgService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IProcurementService, AnchorPro.Services.ProcurementService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.IContractService, AnchorPro.Services.ContractService>();
builder.Services.AddScoped<AnchorPro.Services.Interfaces.ILabelService, AnchorPro.Services.LabelService>(); // Custom Labels
builder.Services.AddScoped<AnchorPro.Services.PlatformConfigService>();
builder.Services.AddScoped<AnchorPro.Services.StripeService>();


// API & Swagger
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Use default configuration for now

var app = builder.Build();

// Seed Database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.IgnoreTenantFilter = true;
        await context.Database.MigrateAsync(); // Apply any pending migrations on startup

        await DbSeeder.SeedRolesAndAdminAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();

    // Enable Swagger
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/api/error");
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found");
// app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseCors("ReactAppPolicy");

app.MapControllers(); // Enable API Controllers

app.Run();

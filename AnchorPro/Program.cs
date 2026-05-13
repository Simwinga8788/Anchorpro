using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using AnchorPro.Components;
using AnchorPro.Components.Account;
using AnchorPro.Data;
using AnchorPro.Services;

var builder = WebApplication.CreateBuilder(args);

// Fix PostgreSQL DateTime offset issues for non-UTC timestamps
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Railway (and most PaaS) inject a PORT env var. Bind to it so traffic routes correctly.
var port = Environment.GetEnvironmentVariable("PORT") ?? "5165";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Allow up to 10MB multipart uploads (for file attachments)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB
});

// Add services to the container.
var allowedOrigins = new List<string>
{
    "http://localhost:5173",
    "http://localhost:3000",
};
var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL");
if (!string.IsNullOrWhiteSpace(frontendUrl))
    allowedOrigins.Add(frontendUrl.TrimEnd('/'));

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();

builder.Services.AddHttpContextAccessor(); // For cookie-based impersonation
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddScoped<IdentityRedirectManager>();
builder.Services.AddScoped<AuthenticationStateProvider, IdentityRevalidatingAuthenticationStateProvider>();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = IdentityConstants.ApplicationScheme;
        options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
    })
    .AddIdentityCookies();

// In production, cookies must be SameSite=None + Secure so they survive
// the cross-origin Next.js proxy (Vercel → Railway).
if (!builder.Environment.IsDevelopment())
{
    builder.Services.ConfigureApplicationCookie(o =>
    {
        o.Cookie.SameSite = SameSiteMode.None;
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    });
}

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

builder.Services.AddScoped<IUserClaimsPrincipalFactory<ApplicationUser>, AnchorUserClaimsPrincipalFactory>();

builder.Services.AddSingleton<IEmailSender<ApplicationUser>, IdentityNoOpEmailSender>();

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
// Use DevEmailService (writes to file) when no SMTP is configured — prevents Railway timeout on login/alerts
var smtpHost = builder.Configuration["Smtp_Host"] ?? "";
if (string.IsNullOrWhiteSpace(smtpHost))
    builder.Services.AddScoped<AnchorPro.Services.Interfaces.IEmailService, AnchorPro.Services.DevEmailService>();
else
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

// Tenant Circuit Handler
builder.Services.AddScoped<Microsoft.AspNetCore.Components.Server.Circuits.CircuitHandler, AnchorPro.Services.TenantCircuitHandler>();

// API & Swagger
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Use default configuration for now

// Session support (used by impersonation to store original PO identity)
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(2);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

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
    app.UseWebAssemblyDebugging();
    app.UseMigrationsEndPoint();

    // Enable Swagger
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found");
// app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseCors("ReactAppPolicy");
app.UseSession(); // Must be before UseAntiforgery and MapControllers
app.UseAntiforgery();

app.MapControllers(); // Enable API Controllers
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode();

// Add additional endpoints required by the Identity /Account Razor components.
app.MapAdditionalIdentityEndpoints();



app.Run();

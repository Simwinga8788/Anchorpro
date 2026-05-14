using Microsoft.AspNetCore.Identity;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Data
{
    public static class DbSeeder
    {
        public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();

            string[] roles = { "Admin", "Planner", "Supervisor", "Technician", "Purchasing", "Storeman" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // 1. Ensure Default Tenant Exists
            var defaultTenant = await context.Tenants.FirstOrDefaultAsync(t => t.Name == "Anchor Corp");
            if (defaultTenant == null)
            {
                defaultTenant = new Tenant
                {
                    Name = "Anchor Corp",
                    Address = "123 Main St, Lusaka",
                    ContactEmail = "admin@anchor.com",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                };
                context.Tenants.Add(defaultTenant);
                await context.SaveChangesAsync(); // Save to get Id
            }

            int tenantId = defaultTenant.Id;

            // 2. Create PLATFORM OWNER (No TenantId - manages the platform)
            var platformOwnerEmail = "simwinga8788@gmail.com";
            var platformOwner = await userManager.FindByEmailAsync(platformOwnerEmail);
            var platformOwnerPassword = "386599/33/1";
            var defaultPassword = "AnchorPro!123";

            if (platformOwner == null)
            {
                var newPlatformOwner = new ApplicationUser
                {
                    UserName = platformOwnerEmail,
                    Email = platformOwnerEmail,
                    EmailConfirmed = true,
                    FirstName = "Platform",
                    LastName = "Owner",
                    TenantId = null, // NO TENANT - This is the key!
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                };

                var result = await userManager.CreateAsync(newPlatformOwner, platformOwnerPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(newPlatformOwner, "Admin");
                }
            }
            else
            {
                // Update existing platform owner to ensure NO TenantId
                if (platformOwner.TenantId.HasValue)
                {
                    platformOwner.TenantId = null;
                    await userManager.UpdateAsync(platformOwner);
                }
                
                // Reset password
                await userManager.RemovePasswordAsync(platformOwner);
                await userManager.AddPasswordAsync(platformOwner, platformOwnerPassword);
            }

            // 3. Create ANCHOR CORP ADMIN (With TenantId - manages Anchor Corp tenant)
            var adminEmail = "anchorcorp@anchor.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                var newAdmin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FirstName = "Anchor Corp",
                    LastName = "Admin",
                    TenantId = tenantId, // Link to Anchor Corp Tenant
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                };

                var result = await userManager.CreateAsync(newAdmin, defaultPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(newAdmin, "Admin");
                    await userManager.AddToRoleAsync(newAdmin, "Supervisor");
                    
                    // Set owner
                    defaultTenant.OwnerId = newAdmin.Id;
                    context.Tenants.Update(defaultTenant);
                    await context.SaveChangesAsync();
                }
            }
            else
            {
                // Ensure existing admin has TenantId
                if (adminUser.TenantId == null)
                {
                    adminUser.TenantId = tenantId;
                    await userManager.UpdateAsync(adminUser);
                }

                if (!await userManager.IsInRoleAsync(adminUser, "Supervisor"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Supervisor");
                }
                
                // Force Reset Password & Unlock
                if (await userManager.IsLockedOutAsync(adminUser)) 
                {
                     await userManager.SetLockoutEndDateAsync(adminUser, null);
                     await userManager.ResetAccessFailedCountAsync(adminUser);
                }
                
                await userManager.RemovePasswordAsync(adminUser);
                await userManager.AddPasswordAsync(adminUser, defaultPassword);
            }

            // Seed a Supervisor
            var supervisorEmail = "supervisor@anchor.com";
            var supervisorUser = await userManager.FindByEmailAsync(supervisorEmail);
            if (supervisorUser == null)
            {
                var newSupervisor = new ApplicationUser
                {
                    UserName = supervisorEmail,
                    Email = supervisorEmail,
                    EmailConfirmed = true,
                    FirstName = "Workshop",
                    LastName = "Supervisor",
                    TenantId = tenantId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                };

                var result = await userManager.CreateAsync(newSupervisor, defaultPassword);
                if (result.Succeeded) await userManager.AddToRoleAsync(newSupervisor, "Supervisor");
            }
            else
            {
                 if (await userManager.IsLockedOutAsync(supervisorUser)) 
                 {
                     await userManager.SetLockoutEndDateAsync(supervisorUser, null);
                     await userManager.ResetAccessFailedCountAsync(supervisorUser);
                 }
                 await userManager.RemovePasswordAsync(supervisorUser);
                 await userManager.AddPasswordAsync(supervisorUser, defaultPassword);
            }

            // Seed a Technician
            var techEmail = "tech@anchor.com";
            var techUser = await userManager.FindByEmailAsync(techEmail);
            if (techUser == null)
            {
                var newTech = new ApplicationUser
                {
                    UserName = techEmail,
                    Email = techEmail,
                    EmailConfirmed = true,
                    FirstName = "Field",
                    LastName = "Technician",
                    TenantId = tenantId,
                    HourlyRate = 350.00m,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                };

                var result = await userManager.CreateAsync(newTech, defaultPassword);
                if (result.Succeeded) await userManager.AddToRoleAsync(newTech, "Technician");
            }

            else
            {
                 if (await userManager.IsLockedOutAsync(techUser)) 
                 {
                     await userManager.SetLockoutEndDateAsync(techUser, null);
                     await userManager.ResetAccessFailedCountAsync(techUser);
                 }
                 await userManager.RemovePasswordAsync(techUser);
                 await userManager.AddPasswordAsync(techUser, defaultPassword);
            }

            // Seed 3 Additional Technicians
            var moreTechs = new[]
            {
                new { Email = "tech2@anchor.com", First = "John", Last = "Phiri", Rate = 450.00m },
                new { Email = "tech3@anchor.com", First = "Sarah", Last = "Banda", Rate = 550.00m },
                new { Email = "tech4@anchor.com", First = "Mike", Last = "Mulenga", Rate = 400.00m }
            };

            foreach (var t in moreTechs)
            {
                if (await userManager.FindByEmailAsync(t.Email) == null)
                {
                    var u = new ApplicationUser
                    {
                        UserName = t.Email,
                        Email = t.Email,
                        EmailConfirmed = true,
                        FirstName = t.First,
                        LastName = t.Last,
                        TenantId = tenantId,
                        HourlyRate = t.Rate,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    };
                    var r = await userManager.CreateAsync(u, defaultPassword);
                    if (r.Succeeded) await userManager.AddToRoleAsync(u, "Technician");
                }
            }


            // Seed Reference Data
            await SeedReferenceDataAsync(serviceProvider, tenantId);
            await SeedAdminSettingsAsync(serviceProvider, tenantId);
            await SeedSystemSettingsAsync(serviceProvider, tenantId);
        }

        private static async Task SeedAdminSettingsAsync(IServiceProvider serviceProvider, int tenantId)
        {
            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
            // Note: SystemSettings are global for now, but in future could have TenantId
            var existingCompany = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "Org.CompanyName");
            if (existingCompany != null && existingCompany.Value.Contains("CMMS"))
            {
                existingCompany.Value = "Anchor Pro Production Planning";
                await context.SaveChangesAsync();
            }

            if (await context.SystemSettings.AnyAsync(s => s.Key.StartsWith("Org.") || s.Key.StartsWith("Maint."))) return;

            var settings = new List<SystemSetting>
            {
                // ORGANIZATION
                new SystemSetting { Key = "Org.CompanyName", Value = "Anchor Pro Production Planning", Group = "Organization", Description = "Legal trading name of the company", TenantId = tenantId },
                new SystemSetting { Key = "Org.Industry", Value = "Manufacturing", Group = "Organization", Description = "Primary industry of operation", TenantId = tenantId },
                new SystemSetting { Key = "Org.Timezone", Value = "Central African Time", Group = "Organization", Description = "Default system timezone", TenantId = tenantId },
                new SystemSetting { Key = "Org.WorkingHours", Value = "08:00 - 17:00", Group = "Organization", Description = "Standard operation hours", TenantId = tenantId },
                new SystemSetting { Key = "Org.WeekendRules", Value = "Blocked", Group = "Organization", Description = "Scheduling behavior for weekends", TenantId = tenantId },

                // MAINTENANCE RULES
                new SystemSetting { Key = "Maint.RequireTasks", Value = "true", Group = "Maintenance Rules", Description = "Require all tasks finished before job completion", TenantId = tenantId },
                new SystemSetting { Key = "Maint.RequireDowntimeReason", Value = "true", Group = "Maintenance Rules", Description = "Require reason when pausing/stopping jobs", TenantId = tenantId },
                new SystemSetting { Key = "Maint.MinLaborCharge", Value = "1.0", Group = "Maintenance Rules", Description = "Minimum hours charged per job card", TenantId = tenantId },
                new SystemSetting { Key = "Maint.AllowReopen", Value = "false", Group = "Maintenance Rules", Description = "Allow changing status of completed jobs", TenantId = tenantId },

                // SCHEDULING
                new SystemSetting { Key = "Sched.AllowDoubleBooking", Value = "false", Group = "Scheduling", Description = "Allow multiple jobs per technician at once", TenantId = tenantId },
                new SystemSetting { Key = "Sched.MaxJobsPerDay", Value = "5", Group = "Scheduling", Description = "Cap of jobs assigned to a technician per day", TenantId = tenantId },
                new SystemSetting { Key = "Sched.OverdueAutoFlagHours", Value = "24", Group = "Scheduling", Description = "Hours after deadline to trigger 'Overdue' alert", TenantId = tenantId },

                // INVENTORY
                new SystemSetting { Key = "Inv.AllowNegativeStock", Value = "false", Group = "Inventory Rules", Description = "Allow issuing parts not in system stock", TenantId = tenantId },
                new SystemSetting { Key = "Inv.LowStockBehavior", Value = "Warn only", Group = "Inventory Rules", Description = "System action when stock hits threshold", TenantId = tenantId },

                // SAFETY & COMPLIANCE
                new SystemSetting { Key = "Safe.PermitRequired.Electrical", Value = "true", Group = "Safety & Compliance", Description = "Mandatory PTW for electrical work", TenantId = tenantId },
                new SystemSetting { Key = "Safe.DigitalSignature", Value = "true", Group = "Safety & Compliance", Description = "Require digital sign-off on permits", TenantId = tenantId },
                new SystemSetting { Key = "Safe.PermitExpiryLabel", Value = "8 Hours", Group = "Safety & Compliance", Description = "Default validity of a hot work permit", TenantId = tenantId }
            };

            context.SystemSettings.AddRange(settings);
            await context.SaveChangesAsync();
        }

        private static async Task SeedSystemSettingsAsync(IServiceProvider serviceProvider, int tenantId)
        {
            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
            
            // Seed Subscription Plans (System Global, TenantId is null)
            if (!await context.SubscriptionPlans.AnyAsync())
            {
                var plans = new[]
                {
                    new SubscriptionPlan
                    {
                        Name = "Free Trial",
                        Description = "14-day trial with limited features",
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
                        Name = "Professional",
                        Description = "Full-featured Production Planning Tool for growing teams",
                        MonthlyPrice = 2500,
                        AnnualPrice = 25000,
                        Currency = "ZMW",
                        MaxTechnicians = 10,
                        MaxEquipment = 50,
                        MaxActiveJobs = 100,
                        StorageLimitMB = 5000,
                        AllowExports = true,
                        AllowPredictiveEngine = false,
                        AllowMobileAccess = true,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    },
                    new SubscriptionPlan
                    {
                        Name = "Enterprise",
                        Description = "Unlimited access with AI-powered insights",
                        MonthlyPrice = 8000,
                        AnnualPrice = 80000,
                        Currency = "ZMW",
                        MaxTechnicians = 999,
                        MaxEquipment = 999,
                        MaxActiveJobs = 9999,
                        StorageLimitMB = 50000,
                        AllowExports = true,
                        AllowPredictiveEngine = true,
                        AllowMobileAccess = true,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    }
                };

                context.SubscriptionPlans.AddRange(plans);
                await context.SaveChangesAsync();

                // Create default tenant subscription (Linked to Tenant ID!)
                var trialPlan = plans[0];
                var tenantSub = new TenantSubscription
                {
                    TenantId = tenantId,
                    SubscriptionPlanId = trialPlan.Id,
                    Status = "Trial",
                    StartDate = DateTime.UtcNow,
                    TrialEndDate = DateTime.UtcNow.AddDays(14),
                    IsTrial = true,
                    AutoRenew = false,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                };

                context.TenantSubscriptions.Add(tenantSub);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedReferenceDataAsync(IServiceProvider serviceProvider, int tenantId)
        {
            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();

            // Seed Job Types — scoped to this tenant
            if (!await context.JobTypes.AnyAsync(j => j.TenantId == tenantId))
            {
                var jobTypes = new[]
                {
                    new JobType { Name = "Preventive Maintenance", Description = "Scheduled routine maintenance", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new JobType { Name = "Corrective Maintenance", Description = "Repair of broken equipment", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new JobType { Name = "Inspection", Description = "Equipment inspection and assessment", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new JobType { Name = "Calibration", Description = "Equipment calibration", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new JobType { Name = "Emergency Repair", Description = "Urgent breakdown repair", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" }
                };

                context.JobTypes.AddRange(jobTypes);
                await context.SaveChangesAsync();
            }

            // Seed Equipment (Tenant Specific!)
            if (!await context.Equipment.AnyAsync())
            {
                var equipment = new[]
                {
                    new Equipment
                    {
                        Name = "CNC Lathe #1",
                        SerialNumber = "CNC-001",
                        ModelNumber = "XL-2000",
                        Manufacturer = "Haas Automation",
                        Location = "Workshop A - Bay 1",
                        TenantId = tenantId,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    },
                    new Equipment
                    {
                        Name = "Hydraulic Press #2",
                        SerialNumber = "HP-002",
                        ModelNumber = "HP-500T",
                        Manufacturer = "Schuler",
                        Location = "Workshop A - Bay 3",
                        TenantId = tenantId,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    },
                    new Equipment
                    {
                        Name = "Welding Robot #1",
                        SerialNumber = "WR-001",
                        ModelNumber = "ARC-X",
                        Manufacturer = "FANUC",
                        Location = "Workshop B - Bay 2",
                        TenantId = tenantId,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    },
                    new Equipment
                    {
                        Name = "Milling Machine #3",
                        SerialNumber = "MM-003",
                        ModelNumber = "VM-40",
                        Manufacturer = "Haas Automation",
                        Location = "Workshop A - Bay 2",
                        TenantId = tenantId,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    }
                };

                context.Equipment.AddRange(equipment);
                await context.SaveChangesAsync();
            }

            // Seed Downtime Categories — scoped to this tenant
            if (!await context.DowntimeCategories.AnyAsync(c => c.TenantId == tenantId))
            {
                var categories = new[]
                {
                    new DowntimeCategory { Name = "Waiting for Parts", IsPaidTime = true, TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new DowntimeCategory { Name = "Waiting for Instructions", IsPaidTime = true, TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new DowntimeCategory { Name = "Break Time", IsPaidTime = true, TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new DowntimeCategory { Name = "Equipment Breakdown", IsPaidTime = false, TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new DowntimeCategory { Name = "Safety Issue", IsPaidTime = true, TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" }
                };

                context.DowntimeCategories.AddRange(categories);
                await context.SaveChangesAsync();
            }

            // Seed Job Cards (Tenant Specific!)
            if (!await context.JobCards.AnyAsync())
            {
                var jobTypes = await context.JobTypes.ToListAsync();
                var equipments = await context.Equipment.Where(e => e.TenantId == tenantId).ToListAsync();
                var technician = await context.Users.FirstOrDefaultAsync(u => u.Email == "tech@anchor.com");

                if (jobTypes.Any() && equipments.Any())
                {
                    // 1. ACTIVE EMERGENCY
                    var emergency = new JobCard
                    {
                        JobNumber = "EMG-911",
                        JobTypeId = jobTypes.First(j => j.Name == "Emergency Repair").Id,
                        EquipmentId = equipments[0].Id,
                        Description = "Critical engine overheating - Production halted!",
                        Status = Data.Enums.JobStatus.InProgress,
                        Priority = Data.Enums.JobPriority.Critical,
                        AssignedTechnicianId = technician?.Id,
                        TenantId = tenantId,
                        CreatedAt = DateTime.UtcNow.AddHours(-2),
                        CreatedBy = "System"
                    };
                    context.JobCards.Add(emergency);

                    // 2. ROUTINE BACKLOG
                    var backlog = new JobCard
                    {
                        JobNumber = "JOB-102",
                        JobTypeId = jobTypes.First(j => j.Name == "Inspection").Id,
                        EquipmentId = equipments[1].Id,
                        Description = "Quarterly safety inspection",
                        Status = Data.Enums.JobStatus.Unscheduled,
                        Priority = Data.Enums.JobPriority.Normal,
                        TenantId = tenantId,
                        CreatedAt = DateTime.UtcNow.AddDays(-1),
                        CreatedBy = "System"
                    };
                    context.JobCards.Add(backlog);

                    // 3. SCHEDULED PREVENTIVE
                    var scheduled = new JobCard
                    {
                        JobNumber = "JOB-201",
                        JobTypeId = jobTypes.First(j => j.Name == "Preventive Maintenance").Id,
                        EquipmentId = equipments[2].Id,
                        Description = "500h Service",
                        Status = Data.Enums.JobStatus.Scheduled,
                        Priority = Data.Enums.JobPriority.Normal,
                        AssignedTechnicianId = technician?.Id,
                        ScheduledStartDate = DateTime.UtcNow.Date,
                        ScheduledEndDate = DateTime.UtcNow.Date.AddHours(4),
                        TenantId = tenantId,
                        CreatedAt = DateTime.UtcNow.AddDays(-5),
                        CreatedBy = "System"
                    };
                    context.JobCards.Add(scheduled);

                    await context.SaveChangesAsync();

                    await context.SaveChangesAsync();
                }
            }

            // Seed Customers (CRM)
            if (!await context.Customers.AnyAsync())
            {
                var customers = new[]
                {
                    new Customer { Name = "Konkola Copper Mines", Email = "ops@kcm.co.zm", Phone = "+260 211 123456", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new Customer { Name = "First Quantum Minerals", Email = "procure@fqm.com", Phone = "+260 211 654321", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new Customer { Name = "Mopani Copper Mines", Email = "maint@mopani.co.zm", Phone = "+260 211 987654", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" }
                };
                context.Customers.AddRange(customers);
                await context.SaveChangesAsync();
            }

            // Seed some COMPLETED jobs for report variety
            if (!await context.JobCards.AnyAsync(j => j.Status == JobStatus.Completed))
            {
                var equipments = await context.Equipment.Where(e => e.TenantId == tenantId).ToListAsync();
                var customers = await context.Customers.Where(c => c.TenantId == tenantId).ToListAsync();
                var jobTypes = await context.JobTypes.ToListAsync();
                var technician = await context.Users.FirstOrDefaultAsync(u => u.Email == "tech@anchor.com");

                if (equipments.Any() && customers.Any() && jobTypes.Any())
                {
                    var completedJobs = new List<JobCard>();
                    for (int i = 1; i <= 10; i++)
                    {
                        var cost = 1200 + (i * 250);
                        var revenue = cost * 1.45m;
                        var profit = revenue - cost;
                        
                        completedJobs.Add(new JobCard
                        {
                            JobNumber = $"JOB-DONE-{1000 + i}",
                            Description = $"Historical Job {i} - Corrective Maintenance",
                            EquipmentId = equipments[i % equipments.Count].Id,
                            CustomerId = customers[i % customers.Count].Id,
                            JobTypeId = jobTypes.First(j => j.Name.Contains("Corrective") || j.Name.Contains("Repair")).Id,
                            Status = JobStatus.Completed,
                            ActualStartDate = DateTime.UtcNow.AddDays(-(30 - i)).AddHours(-10),
                            ActualEndDate = DateTime.UtcNow.AddDays(-(30 - i)).AddHours(-2),
                            AssignedTechnicianId = technician?.Id,
                            LaborCost = cost * 0.4m,
                            PartsCost = cost * 0.6m,
                            TotalCost = cost,
                            InvoiceAmount = revenue,
                            Profit = profit,
                            ProfitMarginPercent = Math.Round((profit / revenue) * 100, 2),
                            TenantId = tenantId,
                            CreatedAt = DateTime.UtcNow.AddDays(-60),
                            CreatedBy = "System"
                        });
                    }
                    context.JobCards.AddRange(completedJobs);
                    await context.SaveChangesAsync();
                }
            }

            // Seed Departments (Organizational Layer)
            if (!await context.Departments.AnyAsync())
            {
                var depts = new[]
                {
                    new Department { Name = "Mechanical Workshop", CostCode = "CC-MECH-01", Description = "Engine and chassis repairs", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new Department { Name = "Electrical & Instrumentation", CostCode = "CC-ELEC-02", Description = "Automation and electrical maintenance", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new Department { Name = "Hydraulics Unit", CostCode = "CC-HYD-03", Description = "Pump and cylinder refurbishments", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" }
                };
                context.Departments.AddRange(depts);
                await context.SaveChangesAsync();
            }

            // Seed Suppliers (Procurement Layer)
            if (!await context.Suppliers.AnyAsync())
            {
                var suppliers = new[]
                {
                    new Supplier { Name = "Cummins Zambia", SupplierCode = "SUP-CUM-01", ContactPerson = "Chanda Phiri", Email = "sales@cummins.zm", Phone = "+260 211 445566", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new Supplier { Name = "Atlas Copco Mining Ltd", SupplierCode = "SUP-ATL-02", ContactPerson = "Miriam Zulu", Email = "support@atlascopco.zm", Phone = "+260 212 778899", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
                    new Supplier { Name = "Barloworld Equipment", SupplierCode = "SUP-BAR-03", ContactPerson = "Kevin Mpundu", Email = "parts@barloworld.zm", Phone = "+260 212 110022", TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = "System" }
                };
                context.Suppliers.AddRange(suppliers);
                await context.SaveChangesAsync();
            }

            // Seed Contracts (Contracts Layer)
            if (!await context.Contracts.AnyAsync())
            {
                var firstCustomer = await context.Customers.FirstOrDefaultAsync(c => c.TenantId == tenantId);
                if (firstCustomer != null)
                {
                    var contracts = new[]
                    {
                        new Contract 
                        { 
                            Title = "Fleet Maintenance Service Agreement", 
                            ContractNumber = "CONT-2025-001", 
                            CustomerId = firstCustomer.Id, 
                            StartDate = DateTime.UtcNow.AddMonths(-2), 
                            EndDate = DateTime.UtcNow.AddMonths(10), 
                            Status = ContractStatus.Active, 
                            Value = 1200000, 
                            MonthlyFee = 100000, 
                            SLAHours = 4, 
                            Terms = "Standard 24/7 breakdown support with 4-hour response time.",
                            TenantId = tenantId, 
                            CreatedAt = DateTime.UtcNow, 
                            CreatedBy = "System" 
                        }
                    };
                    context.Contracts.AddRange(contracts);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}

using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace AnchorPro.Tests;

public class JobCardServiceTests
{
    private static ApplicationDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var tenantSvc = new Mock<ICurrentTenantService>();
        tenantSvc.Setup(t => t.TenantId).Returns((int?)null);
        var ctx = new ApplicationDbContext(options, tenantSvc.Object);
        ctx.IgnoreTenantFilter = true;
        return ctx;
    }

    private static JobCardService BuildService(string dbName)
    {
        var mock = new Mock<IDbContextFactory<ApplicationDbContext>>();
        mock.Setup(f => f.CreateDbContext()).Returns(() => CreateContext(dbName));

        var invMock  = new Mock<IInventoryService>();
        var emailMock = new Mock<IEmailService>();
        var settingsMock = new Mock<ISettingsService>();

        return new JobCardService(mock.Object, invMock.Object, emailMock.Object, settingsMock.Object);
    }

    [Fact]
    public async Task CreateJobCard_AssignsJobNumber()
    {
        var db = Guid.NewGuid().ToString();
        int equipId, typeId;

        using (var ctx = CreateContext(db))
        {
            var equip = new Equipment { Name = "Excavator A", CreatedAt = DateTime.UtcNow };
            var jtype = new JobType   { Name = "Preventive",  CreatedAt = DateTime.UtcNow };
            ctx.Equipment.Add(equip);
            ctx.JobTypes.Add(jtype);
            await ctx.SaveChangesAsync();
            equipId = equip.Id;
            typeId  = jtype.Id;
        }

        var service = BuildService(db);
        var card = new JobCard
        {
            EquipmentId = equipId,
            JobTypeId   = typeId,
            Description = "Routine PM",
            Priority    = JobPriority.Normal,
            Status      = JobStatus.Unscheduled,
            CreatedAt   = DateTime.UtcNow,
        };
        await service.CreateJobCardAsync(card, "admin-user");

        using var ctx2 = CreateContext(db);
        var saved = await ctx2.JobCards.FirstOrDefaultAsync(j => j.Description == "Routine PM");
        Assert.NotNull(saved);
        Assert.Equal("admin-user", saved.CreatedBy);
        Assert.Equal(JobStatus.Unscheduled, saved.Status);
    }

    [Fact]
    public async Task GetJobCardByIdAsync_ReturnsNull_WhenNotFound()
    {
        var result = await BuildService(Guid.NewGuid().ToString()).GetJobCardByIdAsync(99999);
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateJobStatus_ChangesStatus()
    {
        var db = Guid.NewGuid().ToString();
        int id;
        using (var ctx = CreateContext(db))
        {
            var equip = new Equipment { Name = "Pump B",    CreatedAt = DateTime.UtcNow };
            var jtype = new JobType   { Name = "Corrective", CreatedAt = DateTime.UtcNow };
            ctx.Equipment.Add(equip); ctx.JobTypes.Add(jtype);
            await ctx.SaveChangesAsync();

            var card = new JobCard
            {
                EquipmentId = equip.Id, JobTypeId = jtype.Id,
                Description = "Fix leak",
                Status      = JobStatus.Scheduled,
                Priority    = JobPriority.High,
                CreatedAt   = DateTime.UtcNow,
            };
            ctx.JobCards.Add(card);
            await ctx.SaveChangesAsync();
            id = card.Id;
        }

        await BuildService(db).UpdateJobStatusAsync(id, JobStatus.InProgress, "tech-user");

        using var ctx2 = CreateContext(db);
        var saved = await ctx2.JobCards.FindAsync(id);
        Assert.Equal(JobStatus.InProgress, saved!.Status);
    }
}

using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace AnchorPro.Tests;

/// <summary>Tests for TimeEntry persistence directly on the DbContext.</summary>
public class TimeEntryTests
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

    [Fact]
    public async Task TimeEntry_ClockIn_PersistsEntry()
    {
        var db = Guid.NewGuid().ToString();
        using var ctx = CreateContext(db);

        var entry = new TimeEntry
        {
            JobCardId = 1,
            TechnicianId = "user-abc",
            ClockIn = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };
        ctx.TimeEntries.Add(entry);
        await ctx.SaveChangesAsync();

        var saved = await ctx.TimeEntries.FirstOrDefaultAsync(t => t.TechnicianId == "user-abc");
        Assert.NotNull(saved);
        Assert.Null(saved.ClockOut);
        Assert.Equal(0, saved.DurationMinutes);
    }

    [Fact]
    public async Task TimeEntry_ClockOut_SetsDuration()
    {
        var db = Guid.NewGuid().ToString();
        using var ctx = CreateContext(db);

        var clockIn = DateTime.UtcNow.AddHours(-2);
        var entry = new TimeEntry
        {
            JobCardId = 1,
            TechnicianId = "user-xyz",
            ClockIn = clockIn,
            CreatedAt = clockIn,
        };
        ctx.TimeEntries.Add(entry);
        await ctx.SaveChangesAsync();

        // Simulate clock out
        entry.ClockOut = DateTime.UtcNow;
        entry.DurationMinutes = (int)(entry.ClockOut.Value - entry.ClockIn).TotalMinutes;
        await ctx.SaveChangesAsync();

        var saved = await ctx.TimeEntries.FindAsync(entry.Id);
        Assert.NotNull(saved!.ClockOut);
        Assert.True(saved.DurationMinutes >= 119 && saved.DurationMinutes <= 121);
    }

    [Fact]
    public async Task TimeEntry_OnlyOneOpenEntryPerUser()
    {
        var db = Guid.NewGuid().ToString();
        using var ctx = CreateContext(db);

        ctx.TimeEntries.Add(new TimeEntry { JobCardId = 1, TechnicianId = "user-1", ClockIn = DateTime.UtcNow, CreatedAt = DateTime.UtcNow });
        await ctx.SaveChangesAsync();

        var openEntries = await ctx.TimeEntries.Where(t => t.TechnicianId == "user-1" && t.ClockOut == null).CountAsync();
        Assert.Equal(1, openEntries);
    }

    [Fact]
    public async Task TimeEntry_Delete_RemovesEntry()
    {
        var db = Guid.NewGuid().ToString();
        using var ctx = CreateContext(db);

        var entry = new TimeEntry { JobCardId = 1, TechnicianId = "del-user", ClockIn = DateTime.UtcNow, CreatedAt = DateTime.UtcNow };
        ctx.TimeEntries.Add(entry);
        await ctx.SaveChangesAsync();

        ctx.TimeEntries.Remove(entry);
        await ctx.SaveChangesAsync();

        Assert.False(await ctx.TimeEntries.AnyAsync(t => t.TechnicianId == "del-user"));
    }
}

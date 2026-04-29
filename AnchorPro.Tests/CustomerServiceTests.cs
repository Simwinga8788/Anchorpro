using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace AnchorPro.Tests;

public class CustomerServiceTests
{
    private static ApplicationDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var tenantSvc = new Mock<ICurrentTenantService>();
        tenantSvc.Setup(t => t.TenantId).Returns((int?)null);
        var ctx = new ApplicationDbContext(options, tenantSvc.Object);
        ctx.IgnoreTenantFilter = true;
        return ctx;
    }

    private static IDbContextFactory<ApplicationDbContext> FactoryFor(string dbName)
    {
        var mock = new Mock<IDbContextFactory<ApplicationDbContext>>();
        mock.Setup(f => f.CreateDbContext()).Returns(() => CreateContext(dbName));
        return mock.Object;
    }

    [Fact]
    public async Task GetAllCustomersAsync_ReturnsAllCustomers()
    {
        // Arrange
        var db = dbName();
        using (var ctx = CreateContext(db))
        {
            ctx.Customers.AddRange(
                new Customer { Name = "Zambia Mining Co", CreatedAt = DateTime.UtcNow },
                new Customer { Name = "Lusaka Steel",     CreatedAt = DateTime.UtcNow }
            );
            await ctx.SaveChangesAsync();
        }
        var service = new CustomerService(FactoryFor(db));

        // Act
        var result = await service.GetAllCustomersAsync();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, c => c.Name == "Zambia Mining Co");
    }

    [Fact]
    public async Task CreateCustomerAsync_PersistsCustomer()
    {
        var db = dbName();
        var service = new CustomerService(FactoryFor(db));

        var customer = new Customer { Name = "Copperbelt Drilling", CreatedAt = DateTime.UtcNow };
        await service.CreateCustomerAsync(customer, "test-user");

        using var ctx = CreateContext(db);
        var saved = await ctx.Customers.FirstOrDefaultAsync(c => c.Name == "Copperbelt Drilling");
        Assert.NotNull(saved);
        Assert.Equal("test-user", saved.CreatedBy);
    }

    [Fact]
    public async Task GetCustomerByIdAsync_ReturnsNull_WhenNotFound()
    {
        var service = new CustomerService(FactoryFor(dbName()));
        var result = await service.GetCustomerByIdAsync(9999);
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateCustomerAsync_UpdatesFields()
    {
        var db = dbName();
        int id;
        using (var ctx = CreateContext(db))
        {
            var c = new Customer { Name = "OldName", CreatedAt = DateTime.UtcNow };
            ctx.Customers.Add(c);
            await ctx.SaveChangesAsync();
            id = c.Id;
        }

        var service = new CustomerService(FactoryFor(db));
        var updated = new Customer { Id = id, Name = "NewName", CreatedAt = DateTime.UtcNow };
        await service.UpdateCustomerAsync(updated, "updater");

        using var ctx2 = CreateContext(db);
        var saved = await ctx2.Customers.FindAsync(id);
        Assert.Equal("NewName", saved!.Name);
    }

    [Fact]
    public async Task DeleteCustomerAsync_RemovesCustomer()
    {
        var db = dbName();
        int id;
        using (var ctx = CreateContext(db))
        {
            var c = new Customer { Name = "ToDelete", CreatedAt = DateTime.UtcNow };
            ctx.Customers.Add(c);
            await ctx.SaveChangesAsync();
            id = c.Id;
        }

        var service = new CustomerService(FactoryFor(db));
        await service.DeleteCustomerAsync(id);

        using var ctx2 = CreateContext(db);
        Assert.False(await ctx2.Customers.AnyAsync(c => c.Id == id));
    }

    private static string dbName() => Guid.NewGuid().ToString();
}

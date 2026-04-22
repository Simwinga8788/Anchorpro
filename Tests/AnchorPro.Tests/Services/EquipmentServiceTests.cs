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
    public class EquipmentServiceTests : IDisposable
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly EquipmentService _service;
        private readonly ApplicationDbContext _context;

        public EquipmentServiceTests()
        {
            // Setup in-memory database factory
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var factoryMock = new Mock<IDbContextFactory<ApplicationDbContext>>();
            _context = new ApplicationDbContext(options);
            factoryMock.Setup(f => f.CreateDbContext()).Returns(_context);

            _factory = factoryMock.Object;
            _service = new EquipmentService(_factory);

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            var equipment = new List<Equipment>
            {
                new Equipment
                {
                    Id = 1,
                    Name = "Haul Truck 001",
                    SerialNumber = "HT-001",
                    ModelNumber = "797F",
                    Manufacturer = "Caterpillar",
                    Location = "Mine Site A",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Equipment
                {
                    Id = 2,
                    Name = "Excavator 001",
                    SerialNumber = "EX-001",
                    ModelNumber = "PC8000",
                    Manufacturer = "Komatsu",
                    Location = "Workshop",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                }
            };

            _context.Equipment.AddRange(equipment);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetAllEquipmentAsync_ReturnsAllEquipment()
        {
            // Act
            var result = await _service.GetAllEquipmentAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task GetEquipmentByIdAsync_ValidId_ReturnsEquipment()
        {
            // Act
            var result = await _service.GetEquipmentByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Haul Truck 001", result.Name);
            Assert.Equal("HT-001", result.SerialNumber);
        }

        [Fact]
        public async Task GetEquipmentByIdAsync_InvalidId_ReturnsNull()
        {
            // Act
            var result = await _service.GetEquipmentByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateEquipmentAsync_ValidEquipment_UpdatesSuccessfully()
        {
            // Arrange
            var equipment = await _service.GetEquipmentByIdAsync(1);
            Assert.NotNull(equipment);
            
            equipment.Location = "Workshop";
            equipment.Manufacturer = "Updated Manufacturer";

            // Act
            await _service.UpdateEquipmentAsync(equipment, "test-user");

            // Assert
            var updated = await _service.GetEquipmentByIdAsync(1);
            Assert.NotNull(updated);
            Assert.Equal("Workshop", updated.Location);
            Assert.Equal("Updated Manufacturer", updated.Manufacturer);
            Assert.NotNull(updated.UpdatedAt);
            Assert.Equal("test-user", updated.UpdatedBy);
        }

        [Fact]
        public async Task DeleteEquipmentAsync_ValidId_DeletesSuccessfully()
        {
            // Act
            await _service.DeleteEquipmentAsync(2);

            // Assert
            var equipment = await _service.GetEquipmentByIdAsync(2);
            Assert.Null(equipment);

            var allEquipment = await _service.GetAllEquipmentAsync();
            Assert.Single(allEquipment);
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}

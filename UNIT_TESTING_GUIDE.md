# Anchor Pro - Unit Testing Guide

## Test Project Structure

```
Tests/
└── AnchorPro.Tests/
    ├── Services/
    │   ├── SubscriptionServiceTests.cs
    │   └── EquipmentServiceTests.cs
    └── AnchorPro.Tests.csproj
```

## Running Tests

### Run All Tests
```powershell
dotnet test Tests/AnchorPro.Tests/AnchorPro.Tests.csproj
```

### Run Specific Test Class
```powershell
dotnet test Tests/AnchorPro.Tests/AnchorPro.Tests.csproj --filter "FullyQualifiedName~SubscriptionServiceTests"
```

### Run with Verbose Output
```powershell
dotnet test Tests/AnchorPro.Tests/AnchorPro.Tests.csproj --logger "console;verbosity=detailed"
```

### Generate Code Coverage
```powershell
dotnet test Tests/AnchorPro.Tests/AnchorPro.Tests.csproj /p:CollectCoverage=true
```

## Test Coverage

### SubscriptionServiceTests (12 tests)
- ✅ GetCurrentSubscriptionAsync_ReturnsSubscription
- ✅ GetCurrentPlanAsync_ReturnsPlan
- ✅ GetAllPlansAsync_ReturnsAllActivePlans
- ✅ CheckLimitAsync_Equipment_WithinLimit_ReturnsTrue
- ✅ CheckLimitAsync_Equipment_ExceedsLimit_ReturnsFalse
- ✅ IsFeatureEnabledAsync_MobileAccess_ReturnsTrue
- ✅ IsFeatureEnabledAsync_Exports_ReturnsFalse
- ✅ IsTrialExpiredAsync_ActiveTrial_ReturnsFalse
- ✅ GetDaysRemainingAsync_ReturnsDaysLeft
- ✅ UpgradeSubscriptionAsync_ValidUpgrade_ReturnsTrue
- ✅ UpgradeSubscriptionAsync_InvalidPlan_ReturnsFalse

### EquipmentServiceTests (7 tests)
- ✅ GetAllEquipmentAsync_ReturnsAllEquipment
- ✅ GetEquipmentByIdAsync_ValidId_ReturnsEquipment
- ✅ GetEquipmentByIdAsync_InvalidId_ReturnsNull
- ✅ CreateEquipmentAsync_ValidEquipment_CreatesSuccessfully
- ✅ UpdateEquipmentAsync_ValidEquipment_UpdatesSuccessfully
- ✅ DeleteEquipmentAsync_ValidId_DeletesSuccessfully
- ✅ GetEquipmentByStatusAsync_ReturnsFilteredEquipment

## Test Dependencies

### NuGet Packages
- `xunit` - Testing framework
- `xunit.runner.visualstudio` - Test runner
- `Moq` - Mocking framework
- `Microsoft.EntityFrameworkCore.InMemory` - In-memory database for testing
- `Microsoft.NET.Test.Sdk` - Test SDK

### Project References
- `AnchorPro.csproj` - Main application project

## Writing New Tests

### Test Class Template
```csharp
using Xunit;
using Moq;
using AnchorPro.Services;
using AnchorPro.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace AnchorPro.Tests.Services
{
    public class YourServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly YourService _service;

        public YourServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _service = new YourService(_context);
            
            SeedTestData();
        }

        private void SeedTestData()
        {
            // Add test data
        }

        [Fact]
        public async Task YourTest_Scenario_ExpectedResult()
        {
            // Arrange
            
            // Act
            
            // Assert
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup .NET
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: '8.0.x'
      - name: Restore dependencies
        run: dotnet restore
      - name: Build
        run: dotnet build --no-restore
      - name: Test
        run: dotnet test --no-build --verbosity normal
```

## Best Practices

### 1. Test Naming Convention
- Use descriptive names: `MethodName_Scenario_ExpectedResult`
- Example: `GetEquipmentById_ValidId_ReturnsEquipment`

### 2. Arrange-Act-Assert Pattern
```csharp
[Fact]
public async Task Example_Test()
{
    // Arrange - Set up test data and dependencies
    var testData = new Equipment { Name = "Test" };
    
    // Act - Execute the method being tested
    var result = await _service.CreateAsync(testData);
    
    // Assert - Verify the expected outcome
    Assert.NotNull(result);
    Assert.Equal("Test", result.Name);
}
```

### 3. Use In-Memory Database
- Each test gets a fresh database instance
- No cleanup needed between tests
- Fast execution

### 4. Mock External Dependencies
```csharp
var mockEmailService = new Mock<IEmailService>();
mockEmailService.Setup(x => x.SendAsync(It.IsAny<string>()))
    .ReturnsAsync(true);
```

### 5. Test Edge Cases
- Null inputs
- Empty collections
- Invalid IDs
- Boundary conditions

## Troubleshooting

### Tests Not Discovered
```powershell
dotnet test --list-tests
```

### Build Errors
```powershell
dotnet build Tests/AnchorPro.Tests/AnchorPro.Tests.csproj
```

### Clear Test Cache
```powershell
dotnet clean
dotnet build
dotnet test
```

## Next Steps

### Additional Test Classes Needed
- [ ] JobCardServiceTests
- [ ] InventoryServiceTests
- [ ] DowntimeServiceTests
- [ ] DashboardServiceTests
- [ ] SettingsServiceTests
- [ ] ReferenceDataServiceTests

### Integration Tests
- [ ] API endpoint tests
- [ ] Database migration tests
- [ ] Authentication flow tests
- [ ] End-to-end workflow tests

### Performance Tests
- [ ] Load testing for dashboards
- [ ] Concurrent user scenarios
- [ ] Database query performance

---

**Last Updated**: 2026-02-03  
**Test Framework**: xUnit  
**Coverage Target**: 80%+

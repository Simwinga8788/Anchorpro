using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class EquipmentService : IEquipmentService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly ISubscriptionService _subscriptionService;

        public EquipmentService(
            IDbContextFactory<ApplicationDbContext> factory,
            ISubscriptionService subscriptionService)
        {
            _factory = factory;
            _subscriptionService = subscriptionService;
        }

        public async Task<List<Equipment>> GetAllEquipmentAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Equipment
                .Include(e => e.Department)
                .OrderByDescending(e => e.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Equipment?> GetEquipmentByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Equipment
                .Include(e => e.Department)
                .Include(e => e.JobCards)
                    .ThenInclude(j => j.JobType)
                .Include(e => e.JobCards)
                    .ThenInclude(j => j.AssignedTechnician)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task CreateEquipmentAsync(Equipment equipment, string userId)
        {
            using var context = _factory.CreateDbContext();

            // Check subscription limits
            var currentCount = await context.Equipment.CountAsync();
            var canAdd = await _subscriptionService.CheckLimitAsync("equipment", currentCount);
            
            if (!canAdd)
            {
                var plan = await _subscriptionService.GetCurrentPlanAsync();
                throw new InvalidOperationException(
                    $"Equipment limit reached. Your current plan allows {plan?.MaxEquipment} equipment. Upgrade your subscription to add more.");
            }

            // Set Audit Fields
            var user = await context.Users.FindAsync(userId);
            equipment.TenantId = user?.TenantId;

            equipment.CreatedAt = DateTime.UtcNow;
            equipment.CreatedBy = userId;

            context.Equipment.Add(equipment);
            await context.SaveChangesAsync();
        }

        public async Task UpdateEquipmentAsync(Equipment equipment, string userId)
        {
            using var context = _factory.CreateDbContext();

            // In a disconnected scenario (like a web form), it's safer to fetch, update, and save
            // to avoid overwriting fields we didn't include in the form or concurrency issues.
            var existing = await context.Equipment.FindAsync(equipment.Id);

            if (existing != null)
            {
                // Map properties (AutoMapper could replace this in larger apps)
                existing.Name = equipment.Name;
                existing.SerialNumber = equipment.SerialNumber;
                existing.ModelNumber = equipment.ModelNumber;
                existing.Manufacturer = equipment.Manufacturer;
                existing.Location = equipment.Location;
                existing.DepartmentId = equipment.DepartmentId;

                // Audit Update
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;

                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteEquipmentAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var equipment = await context.Equipment.FindAsync(id);
            if (equipment != null)
            {
                context.Equipment.Remove(equipment);
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<JobCard>> GetEquipmentHistoryAsync(int equipmentId)
        {
            using var context = _factory.CreateDbContext();
            return await context.JobCards
                .Include(j => j.JobType)
                .Include(j => j.AssignedTechnician)
                .Where(j => j.EquipmentId == equipmentId && (j.Status == Data.Enums.JobStatus.Completed || j.Status == Data.Enums.JobStatus.Cancelled))
                .OrderByDescending(j => j.ActualEndDate ?? j.UpdatedAt ?? j.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<string> ImportEquipmentFromCsvAsync(string csvContent, string userId)
        {
            using var context = _factory.CreateDbContext();
            var user = await context.Users.FindAsync(userId);
            var tenantId = user?.TenantId;

            // Load existing departments for lookup
            var existingDepartments = await context.Departments.Where(d => d.TenantId == tenantId).ToListAsync();

            var lines = csvContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
            if (lines.Length <= 1)
            {
                throw new ArgumentException("CSV content is empty or contains only a header.");
            }

            var firstLine = lines[0];
            if (firstLine.StartsWith("\uFEFF"))
            {
                firstLine = firstLine.Substring(1);
            }

            char separator = ',';
            if (firstLine.Count(c => c == ';') > firstLine.Count(c => c == ','))
            {
                separator = ';';
            }

            var headers = ParseCsvLine(firstLine, separator);
            int nameIdx = -1, serialIdx = -1, modelIdx = -1, manufIdx = -1, locIdx = -1, rateIdx = -1, deptIdx = -1;

            for (int i = 0; i < headers.Count; i++)
            {
                var h = headers[i].ToLower().Trim();
                if (h.Contains("name")) nameIdx = i;
                else if (h.Contains("serial") || h == "sn") serialIdx = i;
                else if (h.Contains("model")) modelIdx = i;
                else if (h.Contains("manuf")) manufIdx = i;
                else if (h.Contains("loc")) locIdx = i;
                else if (h.Contains("rate") || h.Contains("hourly")) rateIdx = i;
                else if (h.Contains("dept") || h.Contains("depart")) deptIdx = i;
            }

            if (nameIdx == -1)
            {
                throw new ArgumentException("CSV must contain a 'Name' column.");
            }

            int successCount = 0;
            int deptCreated = 0;

            // Find current equipment count to generate sequential serial numbers
            var currentCount = await context.Equipment.CountAsync(e => e.TenantId == tenantId);
            int nextSerialNum = currentCount + 1001;

            for (int r = 1; r < lines.Length; r++)
            {
                var line = lines[r];
                if (string.IsNullOrWhiteSpace(line)) continue;

                var values = ParseCsvLine(line, separator);
                if (values.Count == 0) continue;

                string GetValue(int idx) => idx >= 0 && idx < values.Count ? values[idx] : string.Empty;

                var name = GetValue(nameIdx);
                if (string.IsNullOrWhiteSpace(name)) continue;

                // Skip example rows (case-insensitive checks)
                if (name.Contains("[Example", StringComparison.OrdinalIgnoreCase) || 
                    name.Contains("[Describe", StringComparison.OrdinalIgnoreCase) ||
                    name.Contains("example", StringComparison.OrdinalIgnoreCase)) 
                    continue;

                // Also check the index/first column for "example"
                if (values.Count > 0 && values[0].Contains("example", StringComparison.OrdinalIgnoreCase))
                    continue;

                var serial = GetValue(serialIdx).Trim();
                if (serial.Contains("leave blank", StringComparison.OrdinalIgnoreCase) || (serial.StartsWith("[") && serial.EndsWith("]")))
                {
                    serial = string.Empty;
                }

                if (string.IsNullOrWhiteSpace(serial))
                {
                    serial = $"SN-AUTO-{nextSerialNum++}";
                }

                // Resolve Department
                int? deptId = null;
                var deptName = GetValue(deptIdx);
                if (!string.IsNullOrWhiteSpace(deptName))
                {
                    var dept = existingDepartments.FirstOrDefault(d => d.Name.Equals(deptName, StringComparison.OrdinalIgnoreCase));
                    if (dept == null)
                    {
                        dept = new Department { Name = deptName, TenantId = tenantId, CreatedAt = DateTime.UtcNow, CreatedBy = userId };
                        context.Departments.Add(dept);
                        await context.SaveChangesAsync(); // Save to get ID
                        existingDepartments.Add(dept);
                        deptCreated++;
                    }
                    deptId = dept.Id;
                }

                decimal hourlyRate = 150.00m;
                var rateStr = GetValue(rateIdx);
                if (!string.IsNullOrWhiteSpace(rateStr) && decimal.TryParse(rateStr, out var parsedRate))
                {
                    hourlyRate = parsedRate;
                }

                var equipment = new Equipment
                {
                    TenantId = tenantId,
                    Name = name,
                    SerialNumber = serial,
                    ModelNumber = GetValue(modelIdx),
                    Manufacturer = GetValue(manufIdx),
                    Location = GetValue(locIdx),
                    HourlyRate = hourlyRate,
                    DepartmentId = deptId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId
                };

                context.Equipment.Add(equipment);
                successCount++;
            }

            await context.SaveChangesAsync();
            return $"Successfully imported {successCount} equipment items. (Auto-created {deptCreated} departments).";
        }

        private static List<string> ParseCsvLine(string line, char separator = ',')
        {
            var result = new List<string>();
            var current = new System.Text.StringBuilder();
            bool inQuotes = false;
            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '\"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '\"')
                    {
                        current.Append('\"');
                        i++;
                    }
                    else
                    {
                        inQuotes = !inQuotes;
                    }
                }
                else if (c == separator && !inQuotes)
                {
                    result.Add(current.ToString().Trim());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }
            result.Add(current.ToString().Trim());
            return result;
        }
    }
}

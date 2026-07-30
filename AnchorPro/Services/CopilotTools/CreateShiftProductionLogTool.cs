using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services.CopilotTools
{
    public class CreateShiftProductionLogTool : ICopilotTool
    {
        private readonly IShiftProductionLogService _shiftService;

        public CreateShiftProductionLogTool(IShiftProductionLogService shiftService)
        {
            _shiftService = shiftService;
        }

        public string Name => "log_shift_production";
        public string Description => "Creates a shift production log (usually for Mining & Extraction mode) recording the output, date, shift type, and notes.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>
            {
                { "shiftType", new { type = "STRING", description = "Type of shift: Day, Night, or Afternoon" } },
                { "notes", new { type = "STRING", description = "General notes about what was accomplished during the shift" } }
            },
            required = new[] { "shiftType", "notes" }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var shiftTypeStr = args.GetProperty("shiftType").GetString() ?? "Day";
            var notes = args.GetProperty("notes").GetString() ?? "";

            Enum.TryParse<ShiftType>(shiftTypeStr, true, out var shiftType);

            var log = new ShiftProductionLog
            {
                TenantId = tenantId,
                ShiftDate = DateTime.UtcNow,
                Shift = shiftType,
                Remarks = notes,
                Status = ShiftLogStatus.Draft
            };

            var createdLog = await _shiftService.CreateAsync(log, userId);

            return ($"Shift log drafted successfully for the {shiftType} shift. Notes recorded.", "navigate", $"/dashboard/shifts");
        }
    }
}

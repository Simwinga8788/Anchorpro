using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services.CopilotTools
{
    public class GetEquipmentStatusTool : ICopilotTool
    {
        private readonly IEquipmentService _equipmentService;

        public GetEquipmentStatusTool(IEquipmentService equipmentService)
        {
            _equipmentService = equipmentService;
        }

        public string Name => "get_equipment_status";
        public string Description => "Gets the status and details of a specific piece of equipment by its ID.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>
            {
                { "equipmentId", new { type = "INTEGER", description = "The ID of the equipment to lookup." } }
            },
            required = new[] { "equipmentId" }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            if (!args.TryGetProperty("equipmentId", out var idElement))
            {
                return ("I need the equipment ID to look up its status.", "", "");
            }

            var equipmentId = idElement.GetInt32();
            var equipment = await _equipmentService.GetEquipmentByIdAsync(equipmentId);

            if (equipment == null)
            {
                return ($"I could not find any equipment with ID {equipmentId}.", "", "");
            }

            var statusStr = equipment.ModelNumber != null ? "Active" : "Unknown";
            var reply = $"Equipment #{equipmentId} ({equipment.Name}) is currently {statusStr}. Location: {equipment.Location ?? "Unknown"}. Asset Number: {equipment.SerialNumber}.";
            return (reply, "", "");
        }
    }
}

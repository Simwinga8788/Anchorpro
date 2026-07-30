using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services.CopilotTools
{
    public class GetLowInventoryTool : ICopilotTool
    {
        private readonly ApplicationDbContext _db;

        public GetLowInventoryTool(ApplicationDbContext db)
        {
            _db = db;
        }

        public string Name => "get_low_inventory";
        public string Description => "Finds inventory items that are running low and need to be restocked.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>(),
            required = new string[] { }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var lowStockItems = await _db.InventoryItems
                .Where(i => i.TenantId == tenantId && i.QuantityOnHand <= i.ReorderLevel)
                .Take(5)
                .ToListAsync();

            if (!lowStockItems.Any())
            {
                return ("Inventory looks healthy. There are no items currently below their reorder levels.", "", "");
            }

            var reply = $"I found {lowStockItems.Count} items running low:\n\n";
            foreach (var item in lowStockItems)
            {
                reply += $"- **{item.Name}**: {item.QuantityOnHand} in stock (Reorder at {item.ReorderLevel})\n";
            }
            reply += "\nWould you like me to create purchase requisitions for these?";

            return (reply, "navigate", "/dashboard/inventory");
        }
    }
}

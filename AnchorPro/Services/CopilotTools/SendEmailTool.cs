using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services.CopilotTools
{
    public class SendEmailTool : ICopilotTool
    {
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _db;

        public SendEmailTool(IEmailService emailService, ApplicationDbContext db)
        {
            _emailService = emailService;
            _db = db;
        }

        public string Name => "send_email";
        public string Description => "Sends an email to a user within the same tenant. The AI can provide a name (like 'John') and a message body.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>
            {
                { "recipientName", new { type = "STRING", description = "First or last name of the employee/user" } },
                { "subject", new { type = "STRING", description = "Subject line of the email" } },
                { "body", new { type = "STRING", description = "The message body" } }
            },
            required = new[] { "recipientName", "subject", "body" }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var name = args.GetProperty("recipientName").GetString()?.ToLower() ?? "";
            var subject = args.GetProperty("subject").GetString() ?? "No Subject";
            var body = args.GetProperty("body").GetString() ?? "";

            // Find the user by name within this tenant
            var targetUser = await _db.EmployeeProfiles
                .Include(ep => ep.User)
                .Where(ep => ep.TenantId == tenantId && (ep.User.FirstName.ToLower().Contains(name) || ep.User.LastName.ToLower().Contains(name)))
                .Select(ep => ep.User)
                .FirstOrDefaultAsync();

            if (targetUser == null || string.IsNullOrEmpty(targetUser.Email))
            {
                return ($"I could not find an email address for an employee named '{name}'.", "", "");
            }

            await _emailService.SendEmailAsync(targetUser.Email, subject, body);

            return ($"Email sent successfully to {targetUser.FirstName} {targetUser.LastName} ({targetUser.Email}).", "", "");
        }
    }
}

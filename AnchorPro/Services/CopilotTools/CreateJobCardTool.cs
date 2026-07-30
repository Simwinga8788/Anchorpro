using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services.CopilotTools
{
    public class CreateJobCardTool : ICopilotTool
    {
        private readonly IJobCardService _jobCardService;

        public CreateJobCardTool(IJobCardService jobCardService)
        {
            _jobCardService = jobCardService;
        }

        public string Name => "create_job_card";
        public string Description => "Creates a new maintenance job card in the system.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>
            {
                { "description", new { type = "STRING", description = "The description or title of the job card." } },
                { "equipmentId", new { type = "INTEGER", description = "The ID of the equipment this job is for." } },
                { "jobTypeId", new { type = "INTEGER", description = "The ID of the job type (e.g., 1 for Maintenance, 2 for Repair). If unknown, default to 1." } },
                { "priority", new { type = "STRING", description = "The priority of the job: Low, Normal, High, Urgent" } }
            },
            required = new[] { "description", "equipmentId" }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var description = args.GetProperty("description").GetString() ?? "Copilot Job Card";
            var equipmentId = args.GetProperty("equipmentId").GetInt32();
            
            int jobTypeId = 1;
            if (args.TryGetProperty("jobTypeId", out var jtElement))
            {
                jobTypeId = jtElement.GetInt32();
            }

            JobPriority priority = JobPriority.Normal;
            if (args.TryGetProperty("priority", out var pElement))
            {
                var pString = pElement.GetString();
                Enum.TryParse<JobPriority>(pString, true, out priority);
            }

            var jobCard = new JobCard
            {
                Description = description,
                EquipmentId = equipmentId,
                JobTypeId = jobTypeId,
                Priority = priority,
                Status = JobStatus.Unscheduled,
                TenantId = tenantId
            };

            await _jobCardService.CreateJobCardAsync(jobCard, userId);

            return ($"I have successfully created the job card for Equipment #{equipmentId}: '{description}'.", "", "");
        }
    }
}

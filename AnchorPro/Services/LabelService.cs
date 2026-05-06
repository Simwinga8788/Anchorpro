using System.Text.Json;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services
{
    public class LabelService : ILabelService
    {
        private readonly ISettingsService _settingsService;
        private Dictionary<JobPriority, string> _priorityLabels = new();
        private bool _isLoaded = false;

        public LabelService(ISettingsService settingsService)
        {
            _settingsService = settingsService;
            // Initialize defaults
            ResetDefaults();
        }

        private void ResetDefaults()
        {
            _priorityLabels[JobPriority.Low] = "Low";
            _priorityLabels[JobPriority.Normal] = "Normal"; // Map Normal to Normal
            _priorityLabels[JobPriority.High] = "High";
            _priorityLabels[JobPriority.Critical] = "Critical";
        }

        public async Task LoadLabelsAsync()
        {
            if (_isLoaded) return;

            var setting = await _settingsService.GetSettingAsync("Workflow.PriorityLabels");
            if (!string.IsNullOrEmpty(setting))
            {
                try 
                {
                    // Expected JSON: { "Low": "Routine", "Normal": "Standard", "High": "Urgent" }
                    var custom = JsonSerializer.Deserialize<Dictionary<string, string>>(setting);
                    if (custom != null) 
                    {
                        foreach(var kvp in custom) 
                        {
                            if (Enum.TryParse<JobPriority>(kvp.Key, true, out var p)) 
                            {
                                _priorityLabels[p] = kvp.Value;
                            }
                        }
                    }
                } 
                catch (Exception ex)
                {
                    Console.WriteLine($"Error parsing PriorityLabels: {ex.Message}");
                }
            }
            _isLoaded = true;
        }

        public string GetPriorityLabel(JobPriority priority) 
        {
            return _priorityLabels.TryGetValue(priority, out var label) ? label : priority.ToString();
        }
    }
}

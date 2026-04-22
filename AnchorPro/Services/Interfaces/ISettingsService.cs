using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces;

public interface ISettingsService
{
    Task<string> GetSettingAsync(string key, string defaultValue = "");
    Task<T> GetSettingAsync<T>(string key, T defaultValue = default);
    Task SetSettingAsync(string key, string value, string description = "", string group = "General");
    Task<List<SystemSetting>> GetAllSettingsAsync();
    
    // Global / Platform Level
    Task SetGlobalSettingAsync(string key, string value, string description = "", string group = "General");
    Task<List<SystemSetting>> GetGlobalSettingsAsync();
    Task<string> GetGlobalSettingAsync(string key, string defaultValue = "");
    Task<T> GetGlobalSettingAsync<T>(string key, T defaultValue = default);
}

using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services;

public class SettingsService : ISettingsService
{
    private readonly IDbContextFactory<ApplicationDbContext> _factory;

    public SettingsService(IDbContextFactory<ApplicationDbContext> factory)
    {
        _factory = factory;
    }

    public async Task<string> GetSettingAsync(string key, string defaultValue = "")
    {
        using var context = _factory.CreateDbContext();
        var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
        return setting?.Value ?? defaultValue;
    }

    public async Task<T> GetSettingAsync<T>(string key, T defaultValue = default)
    {
        var value = await GetSettingAsync(key);
        if (string.IsNullOrEmpty(value)) return defaultValue;

        try
        {
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return defaultValue;
        }
    }

    public async Task SetSettingAsync(string key, string value, string description = "", string group = "General")
    {
        using var context = _factory.CreateDbContext();
        // Standard Set uses CurrentTenantId automatically via Filter
        var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = key,
                Value = value,
                Description = description,
                Group = group,
                TenantId = context.CurrentTenantId // Explicitly bind to current tenant
            };
            context.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
            if (!string.IsNullOrEmpty(description)) setting.Description = description;
            if (!string.IsNullOrEmpty(group)) setting.Group = group;
        }

        await context.SaveChangesAsync();
    }

    public async Task<List<SystemSetting>> GetAllSettingsAsync()
    {
        using var context = _factory.CreateDbContext();
        return await context.SystemSettings.OrderBy(s => s.Group).ThenBy(s => s.Key).ToListAsync();
    }

    public async Task SetGlobalSettingAsync(string key, string value, string description = "", string group = "General")
    {
        using var context = _factory.CreateDbContext();
        context.IgnoreTenantFilter = true; 
        
        var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key && s.TenantId == null);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = key,
                Value = value,
                Description = description,
                Group = group,
                TenantId = null
            };
            context.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
            if (!string.IsNullOrEmpty(description)) setting.Description = description;
            if (!string.IsNullOrEmpty(group)) setting.Group = group;
        }

        await context.SaveChangesAsync();
    }

    public async Task<List<SystemSetting>> GetGlobalSettingsAsync()
    {
        using var context = _factory.CreateDbContext();
        context.IgnoreTenantFilter = true;
        return await context.SystemSettings
            .Where(s => s.TenantId == null)
            .OrderBy(s => s.Group).ThenBy(s => s.Key)
            .ToListAsync();
    }

    public async Task<string> GetGlobalSettingAsync(string key, string defaultValue = "")
    {
        using var context = _factory.CreateDbContext();
        context.IgnoreTenantFilter = true;
        var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key && s.TenantId == null);
        return setting?.Value ?? defaultValue;
    }

    public async Task<T> GetGlobalSettingAsync<T>(string key, T defaultValue = default)
    {
        var value = await GetGlobalSettingAsync(key);
        if (string.IsNullOrEmpty(value)) return defaultValue;
        try
        {
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return defaultValue;
        }
    }
}

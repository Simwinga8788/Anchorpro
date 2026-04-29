using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace AnchorPro.Services
{
    /// <summary>
    /// Reads/writes platform-level config from SystemSetting (TenantId = null).
    /// Sensitive keys are encrypted with AES-256.
    /// </summary>
    public class PlatformConfigService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IConfiguration _config;

        private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "Stripe:SecretKey", "Stripe:WebhookSecret", "Smtp:Password"
        };

        public PlatformConfigService(IDbContextFactory<ApplicationDbContext> factory, IConfiguration config)
        {
            _factory = factory;
            _config = config;
        }

        private string EncryptionKey => (_config["Encryption:Key"] ?? "AnchorProDefaultKey_32BytesPadded!").PadRight(32)[..32];

        private string Encrypt(string plain)
        {
            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(EncryptionKey);
            aes.GenerateIV();
            using var ms = new MemoryStream();
            ms.Write(aes.IV, 0, aes.IV.Length);
            using var cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write);
            var bytes = Encoding.UTF8.GetBytes(plain);
            cs.Write(bytes, 0, bytes.Length);
            cs.FlushFinalBlock();
            return Convert.ToBase64String(ms.ToArray());
        }

        private string Decrypt(string cipher)
        {
            try
            {
                var full = Convert.FromBase64String(cipher);
                using var aes = Aes.Create();
                aes.Key = Encoding.UTF8.GetBytes(EncryptionKey);
                var iv = full[..16];
                var data = full[16..];
                aes.IV = iv;
                using var ms = new MemoryStream(data);
                using var cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read);
                using var reader = new StreamReader(cs);
                return reader.ReadToEnd();
            }
            catch { return cipher; } // fallback: return as-is if not encrypted
        }

        public async Task<string?> GetAsync(string key)
        {
            using var ctx = _factory.CreateDbContext();
            ctx.IgnoreTenantFilter = true;
            var setting = await ctx.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.TenantId == null && s.Key == key);
            if (setting == null || string.IsNullOrEmpty(setting.Value)) return null;
            return SensitiveKeys.Contains(key) ? Decrypt(setting.Value) : setting.Value;
        }

        public async Task<string?> GetMaskedAsync(string key)
        {
            var val = await GetAsync(key);
            if (string.IsNullOrEmpty(val)) return null;
            return SensitiveKeys.Contains(key) ? "••••••••" : val;
        }

        public async Task SetAsync(string key, string value, string group = "Platform", string description = "")
        {
            using var ctx = _factory.CreateDbContext();
            ctx.IgnoreTenantFilter = true;
            var stored = SensitiveKeys.Contains(key) ? Encrypt(value) : value;
            var existing = await ctx.SystemSettings.FirstOrDefaultAsync(s => s.TenantId == null && s.Key == key);
            if (existing == null)
            {
                ctx.SystemSettings.Add(new SystemSetting { Key = key, Value = stored, Group = group, Description = description, TenantId = null });
            }
            else
            {
                existing.Value = stored;
                existing.Group = group;
            }
            await ctx.SaveChangesAsync();
        }

        public async Task SetManyAsync(Dictionary<string, string> values, string group = "Platform")
        {
            foreach (var kv in values)
                await SetAsync(kv.Key, kv.Value, group);
        }

        public async Task<Dictionary<string, string?>> GetGroupMaskedAsync(string group)
        {
            using var ctx = _factory.CreateDbContext();
            ctx.IgnoreTenantFilter = true;
            var settings = await ctx.SystemSettings
                .AsNoTracking()
                .Where(s => s.TenantId == null && s.Group == group)
                .ToListAsync();
            var result = new Dictionary<string, string?>();
            foreach (var s in settings)
            {
                var val = SensitiveKeys.Contains(s.Key) ? Decrypt(s.Value) : s.Value;
                result[s.Key] = SensitiveKeys.Contains(s.Key) && !string.IsNullOrEmpty(val) ? "••••••••" : val;
            }
            return result;
        }
    }
}

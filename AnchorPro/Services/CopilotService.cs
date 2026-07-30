using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AnchorPro.Services
{
    public class CopilotService : ICopilotService
    {
        private readonly IConfiguration _config;
        private readonly IEnumerable<ICopilotTool> _tools;
        private readonly ApplicationDbContext _db;
        private static readonly HttpClient _httpClient = new HttpClient();

        public CopilotService(IConfiguration config, IEnumerable<ICopilotTool> tools, ApplicationDbContext db)
        {
            _config = config;
            _tools = tools;
            _db = db;
        }

        public async Task<(string Reply, string Action, string Route)> ProcessMessageAsync(string message, string? audioData, string? audioMimeType, string userId, string userName, int tenantId, IList<string> userRoles)
        {
            var apiKey = _config["GeminiApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "YOUR_GEMINI_API_KEY_HERE")
            {
                var geminiSetting = await _db.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == "Integration.Gemini.ApiKey" && s.TenantId == null);
                if (geminiSetting != null && !string.IsNullOrWhiteSpace(geminiSetting.Value))
                {
                    apiKey = geminiSetting.Value;
                }
            }

            if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "YOUR_GEMINI_API_KEY_HERE")
            {
                return ("Gemini API key is not configured. Please set the Gemini API key in Platform Control Panel -> Integrations.", "", "");
            }

            if (message?.Trim().ToLowerInvariant() == "list models")
            {
                try
                {
                    var modelsUrl = $"https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}";
                    var modelsResp = await _httpClient.GetAsync(modelsUrl);
                    var modelsJson = await modelsResp.Content.ReadAsStringAsync();
                    return ($"Available models:\n```json\n{modelsJson}\n```", "", "");
                }
                catch (Exception ex)
                {
                    return ($"Failed to list models: {ex.Message}", "", "");
                }
            }

            var tenant = await _db.Tenants.FindAsync(tenantId);
            var modeName = tenant?.OperationMode.ToString() ?? "GeneralWorkOrder";

            // RBAC Filtering: Only allow tools where AllowedRoles is null, or user has one of the roles
            var allowedTools = _tools.Where(t => t.AllowedRoles == null || t.AllowedRoles.Any(role => userRoles.Contains(role))).ToList();

            // Construct parts array (text and/or audio)
            var parts = new List<object>();
            
            if (!string.IsNullOrWhiteSpace(message))
            {
                parts.Add(new { text = message });
            }

            if (!string.IsNullOrWhiteSpace(audioData) && !string.IsNullOrWhiteSpace(audioMimeType))
            {
                // Remove base64 prefix if present (e.g. "data:audio/webm;base64,")
                var base64 = audioData;
                if (base64.Contains(",")) base64 = base64.Split(',')[1];

                parts.Add(new
                {
                    inline_data = new
                    {
                        mime_type = audioMimeType,
                        data = base64
                    }
                });
            }

            // Build dynamic tool declarations
            var functionDeclarations = allowedTools.Select(t => new
            {
                name = t.Name,
                description = t.Description,
                parameters = t.Parameters
            }).ToArray();

            var requestPayload = new
            {
                system_instruction = new
                {
                    parts = new[]
                    {
                        new { text = $"You are an expert AI Copilot embedded inside the Anchor Pro Enterprise system. The current user is an authenticated employee named {userName}. Their Roles are: {(tenantId == 0 && userRoles.Contains("Admin") ? "Platform Owner, " : "")}{string.Join(", ", userRoles)}. Your company operates in the {modeName} industry mode (adjust your terminology accordingly, e.g., if Mining talk about shifts, if Workshop talk about job cards). ONLY call functions that you have access to. Do not guess what functions exist. Answer strictly based on the functions provided. If they ask a general question about how to use the system, briefly explain it." }
                    }
                },
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = parts.ToArray()
                    }
                },
                tools = functionDeclarations.Length > 0 ? new[] { new { function_declarations = functionDeclarations } } : null
            };

            var url = $"https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key={apiKey}";
            var jsonContent = new StringContent(JsonSerializer.Serialize(requestPayload, new JsonSerializerOptions { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull }), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, jsonContent);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return ($"API Error: {response.StatusCode} - {error}", "", "");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;

            if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var content = candidates[0].GetProperty("content");
                if (content.TryGetProperty("parts", out var responseParts) && responseParts.GetArrayLength() > 0)
                {
                    var part = responseParts[0];

                    // Check for function call
                    if (part.TryGetProperty("functionCall", out var functionCall))
                    {
                        var functionName = functionCall.GetProperty("name").GetString();
                        var args = functionCall.GetProperty("args");
                        var tool = allowedTools.FirstOrDefault(t => t.Name == functionName);
                        if (tool != null)
                        {
                            try
                            {
                                return await tool.ExecuteAsync(args, userId, tenantId);
                            }
                            catch (Exception ex)
                            {
                                return ($"Error executing tool {functionName}: {ex.Message}", "", "");
                            }
                        }
                        return ($"Tool '{functionName}' is not registered in the system.", "", "");
                    }
                    else if (part.TryGetProperty("text", out var text))
                    {
                        return (text.GetString() ?? "I processed your request but had no response.", "", "");
                    }
                }
            }

            return ("I'm sorry, I couldn't understand that request.", "", "");
        }
    }
}

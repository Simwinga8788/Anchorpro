using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services
{
    public class DevEmailService : IEmailService
    {
        private readonly IWebHostEnvironment _environment;

        public DevEmailService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task SendEmailAsync(string to, string subject, string body, Dictionary<string, byte[]>? attachments = null)
        {
            try
            {
                var directory = Path.Combine(_environment.ContentRootPath, "App_Data", "Emails");
                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                var filename = $"{DateTime.UtcNow:yyyy-MM-dd_HH-mm-ss}_{Guid.NewGuid()}.txt";
                var path = Path.Combine(directory, filename);

                var attInfo = attachments != null ? string.Join(", ", attachments.Keys) : "None";
                var emailContent = $@"
-----------------------------------------------------------
To: {to}
Subject: {subject}
Date: {DateTime.UtcNow}
Attachments: {attInfo}
-----------------------------------------------------------
{body}
-----------------------------------------------------------
";
                await File.WriteAllTextAsync(path, emailContent);
            }
            catch (Exception ex)
            {
                // Fallback logging
                Console.WriteLine($"Failed to write email to file: {ex.Message}");
            }
        }
    }
}

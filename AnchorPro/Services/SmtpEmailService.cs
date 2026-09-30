using AnchorPro.Services.Interfaces;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace AnchorPro.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly ISettingsService _settings;
        private readonly ILogger<SmtpEmailService> _logger;
        private readonly IWebHostEnvironment _env;

        public SmtpEmailService(
            ISettingsService settings, 
            ILogger<SmtpEmailService> logger,
            IWebHostEnvironment env)
        {
            _settings = settings;
            _logger = logger;
            _env = env;
        }

        public async Task SendEmailAsync(string to, string subject, string body, Dictionary<string, byte[]>? attachments = null)
        {
            bool enabled = true;
            var enabledStr = await _settings.GetSettingAsync("Email_Enabled");
            if (!string.IsNullOrEmpty(enabledStr))
            {
                bool.TryParse(enabledStr, out enabled);
            }
            else
            {
                enabled = await _settings.GetGlobalSettingAsync<bool>("Email_Enabled", true);
            }

            if (!enabled)
            {
                _logger.LogInformation("Email sending is disabled. To: {to}", to);
                return;
            }

            try
            {
                async Task<T> GetConf<T>(string key, T def)
                {
                    var val = await _settings.GetSettingAsync(key);
                    if (!string.IsNullOrEmpty(val)) return (T)Convert.ChangeType(val, typeof(T));
                    return await _settings.GetGlobalSettingAsync<T>(key, def);
                }

                var host = await GetConf("Smtp_Host", "smtp.gmail.com");
                var port = await GetConf("Smtp_Port", 587);
                var user = await GetConf("Smtp_User", "");
                var passRaw = await GetConf("Smtp_Pass", "");
                var pass = passRaw.Replace(" ", "").Trim(); 
                var fromName = await GetConf("Email_From_Name", "Anchor Pro Construction Suite");
                var fromEmail = await GetConf("Email_From_Address", user);

                // If using Gmail or custom user, ensure fromEmail is valid for the authenticated user
                if (string.IsNullOrWhiteSpace(fromEmail) || fromEmail.Contains("no-reply@anchorpro.com"))
                {
                    if (!string.IsNullOrWhiteSpace(user))
                    {
                        fromEmail = user;
                    }
                }

                if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
                {
                    _logger.LogWarning("SMTP credentials not configured. Falling back to local email store. To: {To}", to);
                    await WriteLocalFallback(to, subject, body, attachments);
                    return;
                }

                _logger.LogInformation("Attempting to send email via MailKit. Host: {Host}, Port: {Port}, User: {User}, From: {From}", host, port, user, fromEmail);

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(fromName, fromEmail));
                message.To.Add(new MailboxAddress("", to));
                message.Subject = subject;

                var builder = new BodyBuilder { HtmlBody = body };
                
                if (attachments != null)
                {
                    foreach (var att in attachments)
                    {
                        builder.Attachments.Add(att.Key, att.Value);
                    }
                }

                message.Body = builder.ToMessageBody();

                using (var client = new SmtpClient())
                {
                    var socketOptions = SecureSocketOptions.Auto;
                    if (port == 587) socketOptions = SecureSocketOptions.StartTls;
                    else if (port == 465) socketOptions = SecureSocketOptions.SslOnConnect;

                    await client.ConnectAsync(host, port, socketOptions);
                    await client.AuthenticateAsync(user, pass);
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }
                
                _logger.LogInformation("Email sent successfully to {to}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {to}. Error: {Message}", to, ex.Message);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner Exception: {Message}", ex.InnerException.Message);
                }
                await WriteLocalFallback(to, subject, body, attachments);
            }
        }

        private async Task WriteLocalFallback(string to, string subject, string body, Dictionary<string, byte[]>? attachments)
        {
            try
            {
                var directory = Path.Combine(_env.ContentRootPath, "App_Data", "Emails");
                if (!Directory.Exists(directory)) Directory.CreateDirectory(directory);
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
            catch {}
        }
    }
}

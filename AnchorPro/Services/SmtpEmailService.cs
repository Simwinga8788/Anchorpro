using AnchorPro.Services.Interfaces;
using MimeKit;
using MailKit.Net.Smtp; // This replaces System.Net.Mail.SmtpClient
using MailKit.Security;

namespace AnchorPro.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly ISettingsService _settings;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(ISettingsService settings, ILogger<SmtpEmailService> logger)
        {
            _settings = settings;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, Dictionary<string, byte[]>? attachments = null)
        {
            // ... (keep fallback)
            bool enabled = false;
            var enabledStr = await _settings.GetSettingAsync("Email_Enabled");
            if (!string.IsNullOrEmpty(enabledStr)) 
            {
                 bool.TryParse(enabledStr, out enabled);
            }
            else
            {
                enabled = await _settings.GetGlobalSettingAsync<bool>("Email_Enabled", false);
            }

            /*
            if (!enabled)
            {
                _logger.LogInformation("Email sending is disabled. To: {to}", to);
                return;
            }
            */

             try
            {
                // Helper to get with fallback
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
                var fromName = await GetConf("Email_From_Name", "Anchor Pro Production Planning");
                var fromEmail = await GetConf("Email_From_Address", user);

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
                    // Accept all SSL certificates (in case server supports STARTTLS)
                    // client.ServerCertificateValidationCallback = (s, c, h, e) => true;

                    // If using Port 587, use StartTls. If 465, use SslOnConnect.
                    var socketOptions = SecureSocketOptions.Auto;
                    if (port == 587) socketOptions = SecureSocketOptions.StartTls;
                    else if (port == 465) socketOptions = SecureSocketOptions.SslOnConnect;

                    await client.ConnectAsync(host, port, socketOptions);

                    // Note: only needed if the SMTP server requires authentication
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
                // Don't rethrow to avoid crashing UI for email errors
            }
        }
    }
}

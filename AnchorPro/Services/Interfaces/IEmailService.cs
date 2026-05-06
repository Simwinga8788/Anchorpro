namespace AnchorPro.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, Dictionary<string, byte[]>? attachments = null);
    }
}

using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IQuotationService
    {
        Task<Quotation?> GetQuotationByIdAsync(int id);
        Task<Quotation?> GetQuotationByJobIdAsync(int jobId);
        Task<Quotation> CreateQuotationFromJobAsync(int jobId, string userId);
        Task<Quotation> UpdateQuotationAsync(int id, decimal subtotal, string? notes, string userId);
        Task AcceptQuotationAsync(int id, string userId);
        Task RejectQuotationAsync(int id, string reason, string userId);
    }
}

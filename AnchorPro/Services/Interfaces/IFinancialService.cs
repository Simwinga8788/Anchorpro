using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IFinancialService
    {
        // Invoices
        Task<List<Invoice>> GetAllInvoicesAsync();
        Task<Invoice?> GetInvoiceByIdAsync(int id);
        Task<Invoice?> GetInvoiceByJobIdAsync(int jobId);
        Task<Invoice> CreateInvoiceFromJobAsync(int jobId, string userId);
        Task CreateAdHocInvoiceAsync(Invoice invoice, string userId);
        Task UpdateInvoiceAsync(Invoice invoice, string userId);

        // Payments
        Task<List<InvoicePayment>> GetPaymentsByInvoiceIdAsync(int invoiceId);
        Task RecordPaymentAsync(InvoicePayment payment, string userId);

        // Financial Dashboard
        Task<FinancialSnapshot> GetFinancialSnapshotAsync();
    }

    public class FinancialSnapshot
    {
        public decimal TotalRevenueMTD { get; set; }
        public decimal TotalCollectedMTD { get; set; }
        public decimal TotalOutstanding { get; set; }
        public decimal OverdueAmount { get; set; }
        public int UnpaidInvoiceCount { get; set; }
    }
}

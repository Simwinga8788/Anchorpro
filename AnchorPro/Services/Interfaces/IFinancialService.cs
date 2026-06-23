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
        Task<AgingReportDto> GetAgingReportAsync();

        // Vendor Bills (Accounts Payable)
        Task<List<VendorBill>> GetAllVendorBillsAsync();
        Task<VendorBill?> GetVendorBillByIdAsync(int id);
        Task<VendorBill> CreateVendorBillFromPOAsync(int poId, string userId);
        Task RecordVendorBillPaymentAsync(int billId, decimal amount, string userId);

        // Ad-hoc Expenses
        Task<List<Expense>> GetAllExpensesAsync();
        Task<Expense> RecordExpenseAsync(Expense expense, string userId);

        // Ledger & Reporting
        Task<List<LedgerEntry>> GetLedgerEntriesAsync(DateTime? from, DateTime? to);
        Task<ProfitAndLossReport> GetProfitAndLossAsync(int month, int year);
    }

    public class FinancialSnapshot
    {
        public decimal TotalRevenueMTD { get; set; }
        public decimal TotalCollectedMTD { get; set; }
        public decimal TotalOutstanding { get; set; }
        public decimal OverdueAmount { get; set; }
        public int UnpaidInvoiceCount { get; set; }
    }

    public class AgingReportDto
    {
        public decimal Current { get; set; } // 0-30 days
        public decimal Days31To60 { get; set; }
        public decimal Days61To90 { get; set; }
        public decimal Days90Plus { get; set; }
        public decimal TotalOutstanding => Current + Days31To60 + Days61To90 + Days90Plus;
    }

    public class ProfitAndLossReport
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        
        public decimal TotalIncome { get; set; }
        
        // Expenses breakdown
        public decimal TotalVendorBills { get; set; }
        public decimal TotalPayroll { get; set; }
        public decimal TotalAdHocExpenses { get; set; }
        
        public decimal TotalExpenses => TotalVendorBills + TotalPayroll + TotalAdHocExpenses;
        
        public decimal NetProfit => TotalIncome - TotalExpenses;
    }
}

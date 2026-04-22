using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IReportingService
    {
        Task<List<ReportDefinition>> GetScheduledReportsAsync();
        Task SaveReportDefinitionAsync(ReportDefinition report);
        Task DeleteReportDefinitionAsync(int id);
        
        // Generates the report content (HTML)
        Task<string> GenerateReportHtmlAsync(ReportType type, int? tenantId = null, int? departmentId = null);
        
        // Generates the report content (Excel)
        Task<byte[]> GenerateReportExcelAsync(ReportType type, int? tenantId = null, int? departmentId = null);

        // Process due reports (called by scheduler)
        Task ProcessDueReportsAsync();
        
        // Manually trigger a report
        Task RunReportAsync(int reportId);
    }
}

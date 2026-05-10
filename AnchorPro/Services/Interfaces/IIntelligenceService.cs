using AnchorPro.Data.Models.Intelligence;

namespace AnchorPro.Services.Interfaces
{
    public interface IIntelligenceService
    {
        Task<List<JobProfitabilityReport>> GetProfitabilityReportAsync(DateTime startDate, DateTime endDate);
        Task<List<TechUtilizationReport>> GetTechnicianUtilizationAsync(DateTime startDate, DateTime endDate);
        Task<List<RevenueByCustomerReport>> GetRevenueByCustomerAsync(DateTime startDate, DateTime endDate);
        Task<List<AssetPerformanceReport>> GetAssetPerformanceAsync(DateTime startDate, DateTime endDate);
        Task<List<InventoryConsumptionReport>> GetInventoryConsumptionAsync(DateTime startDate, DateTime endDate);
        Task<ExecutiveKpiSummary> GetExecutiveSummaryAsync();
        Task<List<SubcontractorDependencyReport>> GetSubcontractorDependencyAsync(DateTime startDate, DateTime endDate);
        Task<List<DowntimeBottleneckReport>> GetDowntimeBottlenecksAsync(DateTime startDate, DateTime endDate);
    }
}

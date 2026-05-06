using AnchorPro.Data.Entities;
using AnchorPro.Data.Models;

namespace AnchorPro.Services.Interfaces
{
    public interface IExportService
    {
        byte[] GenerateJobHistoryCsv(List<JobCard> jobs);
        byte[] GeneratePerformanceExcel(PerformanceMetrics metrics);
    }
}

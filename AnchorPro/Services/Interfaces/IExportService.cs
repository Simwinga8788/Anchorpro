using AnchorPro.Data.Entities;
using AnchorPro.Data.Models;

namespace AnchorPro.Services.Interfaces
{
    public interface IExportService
    {
        byte[] GenerateJobHistoryCsv(List<JobCard> jobs);
        byte[] GeneratePerformanceExcel(PerformanceMetrics metrics);
        byte[] GenerateJobImportTemplate();
        byte[] GenerateJobHistoryExcel(List<JobCard> jobs);

        byte[] GenerateEquipmentImportTemplate(List<string> departments);
        byte[] GenerateEquipmentExcel(List<Equipment> equipment);

        byte[] GenerateInventoryImportTemplate();
        byte[] GenerateInventoryExcel(List<InventoryItem> items);

        byte[] GenerateToolsImportTemplate();
        byte[] GenerateToolsExcel(List<Tool> tools);
    }
}

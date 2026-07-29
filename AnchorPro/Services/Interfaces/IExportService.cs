using AnchorPro.Data.Entities;
using AnchorPro.Data.Models;

namespace AnchorPro.Services.Interfaces
{
    public interface IExportService
    {
        byte[] GenerateJobHistoryCsv(List<JobCard> jobs, Dictionary<string, string>? dict = null);
        byte[] GeneratePerformanceExcel(PerformanceMetrics metrics, Dictionary<string, string>? dict = null);
        byte[] GenerateJobImportTemplate(Dictionary<string, string>? dict = null);
        byte[] GenerateJobHistoryExcel(List<JobCard> jobs, Dictionary<string, string>? dict = null);

        byte[] GenerateEquipmentImportTemplate(List<string> departments, Dictionary<string, string>? dict = null);
        byte[] GenerateEquipmentExcel(List<Equipment> equipment, Dictionary<string, string>? dict = null);

        byte[] GenerateInventoryImportTemplate(Dictionary<string, string>? dict = null);
        byte[] GenerateInventoryExcel(List<InventoryItem> items, Dictionary<string, string>? dict = null);

        byte[] GenerateToolsImportTemplate(Dictionary<string, string>? dict = null);
        byte[] GenerateToolsExcel(List<Tool> tools, Dictionary<string, string>? dict = null);
    }
}

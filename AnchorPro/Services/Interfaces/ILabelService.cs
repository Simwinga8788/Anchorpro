using AnchorPro.Data.Enums;

namespace AnchorPro.Services.Interfaces
{
    public interface ILabelService
    {
        Task LoadLabelsAsync();
        string GetPriorityLabel(JobPriority priority);
    }
}

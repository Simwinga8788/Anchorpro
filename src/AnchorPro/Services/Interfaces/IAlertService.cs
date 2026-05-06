namespace AnchorPro.Services.Interfaces
{
    public interface IAlertService
    {
        Task CheckForLowMarginJobsAsync();
        Task CheckForOverdueJobsAsync();
        Task NotifyTechnicianDelayAsync(string jobNumber, string technicianName, string reason);
    }
}

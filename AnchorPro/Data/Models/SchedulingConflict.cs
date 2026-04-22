namespace AnchorPro.Data.Models
{
    public class SchedulingConflict
    {
        public bool IsConflicted { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<int> ConflictingJobIds { get; set; } = new();
    }
}

namespace AnchorPro.Data.Models;

public class SystemHealth
{
    public double MemoryUsageMB { get; set; }
    public TimeSpan Uptime { get; set; }
    public string OSVersion { get; set; } = string.Empty;
    public int ProcessorCount { get; set; }
    public bool DatabaseConnection { get; set; }
    public Dictionary<string, int> EntityCounts { get; set; } = new();
    public string ServerTime { get; set; } = string.Empty;
}

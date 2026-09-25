using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    /// <summary>
    /// Records the response to a client-supplied Idempotency-Key so a retried request (e.g. an
    /// offline mutation replayed after the original response was lost to a dropped connection)
    /// returns the original result instead of re-running the handler and creating a duplicate.
    /// Not tenant-scoped — the key itself (a client-generated GUID) is already globally unique.
    /// </summary>
    public class IdempotencyRecord
    {
        [Key]
        [MaxLength(64)]
        public string Key { get; set; } = string.Empty;

        public int StatusCode { get; set; }

        public string? ResponseBody { get; set; }

        [MaxLength(100)]
        public string? ContentType { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// General-purpose file upload endpoint.
    /// Files are stored on local disk under wwwroot/uploads/ and served as static files.
    /// Max file size: 10 MB per file.
    /// </summary>
    [Route("api/upload")]
    [ApiController]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly IFileService _fileService;
        private readonly IJobCardService _jobService;

        // Allowed MIME types — includes all phone camera formats
        // iPhone: image/heic, image/heif  |  Android: image/jpeg, image/jpg
        // Some frameworks send application/octet-stream for any binary — handled by extension fallback
        private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            // Images — all common phone formats
            "image/jpeg", "image/jpg",           // JPEG (Android, most phones)
            "image/heic", "image/heif",           // HEIC/HEIF (iPhone/iPad default)
            "image/png",                          // PNG
            "image/gif",                          // GIF
            "image/webp",                         // WebP
            "image/bmp",                          // BMP
            "image/tiff",                         // TIFF
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain", "text/csv",
            // Video (phone recordings)
            "video/mp4", "video/quicktime",       // .mp4, .mov
            "video/3gpp", "video/3gpp2",          // Android video formats
            // Generic binary — allowed only when extension matches known type
            "application/octet-stream"
        };

        // Extension → MIME map used when phone sends application/octet-stream
        private static readonly Dictionary<string, string> ExtensionMimeMap = new(StringComparer.OrdinalIgnoreCase)
        {
            {".jpg",  "image/jpeg"},
            {".jpeg", "image/jpeg"},
            {".heic", "image/heic"},
            {".heif", "image/heif"},
            {".png",  "image/png"},
            {".gif",  "image/gif"},
            {".webp", "image/webp"},
            {".bmp",  "image/bmp"},
            {".pdf",  "application/pdf"},
            {".mp4",  "video/mp4"},
            {".mov",  "video/quicktime"},
            {".3gp",  "video/3gpp"},
            {".csv",  "text/csv"},
            {".txt",  "text/plain"}
        };

        public UploadController(IFileService fileService, IJobCardService jobService)
        {
            _fileService = fileService;
            _jobService = jobService;
        }

        /// <summary>Resolves the effective MIME type, falling back to extension when octet-stream is received.</summary>
        private static string ResolveContentType(IFormFile file)
        {
            var ct = file.ContentType ?? "application/octet-stream";
            if (!ct.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
                return ct;

            // Try to sniff from extension
            var ext = Path.GetExtension(file.FileName);
            return ExtensionMimeMap.TryGetValue(ext, out var mapped) ? mapped : ct;
        }

        /// <summary>
        /// Returns a safe filename. Phones often send empty names or just "image" with no extension.
        /// Falls back to a timestamp-based name with guessed extension.
        /// </summary>
        private static string SafeFileName(IFormFile file, string resolvedMime)
        {
            var name = Path.GetFileName(file.FileName ?? "").Trim();

            // Build extension from MIME if name has none
            if (string.IsNullOrEmpty(Path.GetExtension(name)))
            {
                var ext = resolvedMime switch
                {
                    "image/jpeg" or "image/jpg" => ".jpg",
                    "image/heic"                => ".heic",
                    "image/heif"                => ".heif",
                    "image/png"                 => ".png",
                    "image/gif"                 => ".gif",
                    "image/webp"                => ".webp",
                    "application/pdf"           => ".pdf",
                    "video/mp4"                 => ".mp4",
                    "video/quicktime"           => ".mov",
                    _                           => ".bin"
                };
                name = string.IsNullOrEmpty(name)
                    ? $"upload_{DateTime.UtcNow:yyyyMMddHHmmss}{ext}"
                    : $"{name}{ext}";
            }

            return name;
        }

        // ── GENERAL PURPOSE UPLOAD ────────────────────────────────────────────

        /// <summary>
        /// POST /api/upload?folder=general
        /// Uploads a single file to the server's local disk (wwwroot/uploads/{folder}/).
        /// Returns the relative URL of the stored file.
        ///
        /// Use multipart/form-data with field name "file".
        /// Optional query param: folder (default: "general") — used as subfolder.
        ///
        /// The returned URL can be stored in JobAttachment.FilePath and served directly
        /// as a static file: GET http://localhost:5165/uploads/{folder}/filename.pdf
        /// </summary>
        [HttpPost]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
        public async Task<ActionResult> UploadFile(
            IFormFile file,
            [FromQuery] string folder = "general")
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided or file is empty." });

            var resolvedMime = ResolveContentType(file);

            if (!AllowedTypes.Contains(resolvedMime))
                return BadRequest(new { message = $"File type '{resolvedMime}' is not allowed.", allowedTypes = AllowedTypes });

            var safeFile = new PhoneSafeFormFile(file, SafeFileName(file, resolvedMime), resolvedMime);
            var relativePath = await _fileService.SaveFormFileAsync(safeFile, folder);

            return Ok(new
            {
                fileName = safeFile.FileName,
                filePath = relativePath,
                contentType = resolvedMime,
                fileSizeBytes = file.Length,
                url = $"{Request.Scheme}://{Request.Host}{relativePath}"
            });
        }

        // ── JOB CARD ATTACHMENT (UPLOAD + LINK IN ONE CALL) ──────────────────

        /// <summary>
        /// POST /api/upload/job/{jobId}
        /// Uploads a file AND immediately links it to the specified job card as a JobAttachment.
        /// This is the preferred endpoint for the field technician app.
        ///
        /// Use multipart/form-data with:
        ///   - "file"     (required) — the binary file
        ///   - "category" (optional) — "ProofOfWork" | "DamageReport" | "General" (default)
        ///
        /// Returns the created JobAttachment record.
        /// </summary>
        [HttpPost("job/{jobId}")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<ActionResult> UploadJobAttachment(
            int jobId,
            IFormFile file,
            [FromForm] string category = "General")
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided or file is empty." });

            var resolvedMime = ResolveContentType(file);

            if (!AllowedTypes.Contains(resolvedMime))
                return BadRequest(new { message = $"File type '{resolvedMime}' is not allowed." });

            // Verify the job exists
            var job = await _jobService.GetJobCardByIdAsync(jobId);
            if (job == null)
                return NotFound(new { message = $"Job card {jobId} not found." });

            var safeFileName = SafeFileName(file, resolvedMime);

            // Save to disk: wwwroot/uploads/jobs/{jobId}/
            var safeFile = new PhoneSafeFormFile(file, safeFileName, resolvedMime);
            var relativePath = await _fileService.SaveFormFileAsync(safeFile, $"jobs/{jobId}");
            var userId = User.Identity?.Name ?? "API_User";

            var attachment = new JobAttachment
            {
                JobCardId = jobId,
                FileName = safeFileName,
                FilePath = relativePath,
                ContentType = resolvedMime,
                FileSizeBytes = file.Length,
                Category = category,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId
            };

            await _jobService.AddAttachmentAsync(attachment);

            return Ok(new
            {
                attachment.Id,
                attachment.JobCardId,
                attachment.FileName,
                attachment.FilePath,
                attachment.ContentType,
                attachment.FileSizeBytes,
                attachment.Category,
                url = $"{Request.Scheme}://{Request.Host}{relativePath}"
            });
        }

        // ── DELETE A FILE ─────────────────────────────────────────────────────

        /// <summary>
        /// DELETE /api/upload/job/{jobId}/attachments/{attachmentId}
        /// Removes the attachment record from the DB AND deletes the file from disk.
        /// </summary>
        [HttpDelete("job/{jobId}/attachments/{attachmentId}")]
        public async Task<ActionResult> DeleteJobAttachment(int jobId, int attachmentId)
        {
            await _jobService.RemoveAttachmentAsync(attachmentId);
            return NoContent();
        }
    }

    // ── Phone-safe IFormFile wrapper ──────────────────────────────────────────
    // Wraps the original IFormFile but overrides FileName and ContentType
    // so that phones sending empty names or octet-stream are handled cleanly.

    internal sealed class PhoneSafeFormFile : IFormFile
    {
        private readonly IFormFile _inner;
        public PhoneSafeFormFile(IFormFile inner, string fileName, string contentType)
        {
            _inner = inner;
            FileName = fileName;
            ContentType = contentType;
        }
        public string ContentType { get; }
        public string ContentDisposition => _inner.ContentDisposition;
        public IHeaderDictionary Headers => _inner.Headers;
        public long Length => _inner.Length;
        public string Name => _inner.Name;
        public string FileName { get; }
        public void CopyTo(Stream target) => _inner.CopyTo(target);
        public Task CopyToAsync(Stream target, CancellationToken ct = default) => _inner.CopyToAsync(target, ct);
        public Stream OpenReadStream() => _inner.OpenReadStream();
    }
}

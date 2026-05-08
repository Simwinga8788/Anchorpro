using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Components.Forms;

namespace AnchorPro.Services
{
    public class LocalFileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        public LocalFileService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<string> SaveFileAsync(IBrowserFile file, string subFolder)
        {
            try
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", subFolder);

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate unique filename
                var uniqueFileName = $"{Guid.NewGuid()}_{file.Name}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    // Limit read size to avoid memory issues
                    await file.OpenReadStream(MaxFileSize).CopyToAsync(stream);
                }

                // Return relative URL for storage
                return $"/uploads/{subFolder}/{uniqueFileName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading file: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// API-side upload: accepts IFormFile from a multipart/form-data HTTP request.
        /// Stores file in wwwroot/uploads/{subFolder}/ and returns the relative URL.
        /// </summary>
        public async Task<string> SaveFormFileAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty.");

            if (file.Length > MaxFileSize)
                throw new ArgumentException($"File exceeds the maximum allowed size of {MaxFileSize / 1024 / 1024}MB.");

            // Sanitize the original filename to prevent directory traversal
            var safeOriginalName = Path.GetFileName(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}_{safeOriginalName}";

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", subFolder);
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fullPath = Path.Combine(uploadsFolder, uniqueFileName);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the relative URL — served by UseStaticFiles()
            return $"/uploads/{subFolder}/{uniqueFileName}";
        }

        public void DeleteFile(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl)) return;

            // Convert URL back to path
            // Remove leading slash if present
            var relativePath = fileUrl.TrimStart('/');
            var fullPath = Path.Combine(_environment.WebRootPath, relativePath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
    }
}

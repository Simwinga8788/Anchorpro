using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Http;

namespace AnchorPro.Services.Interfaces
{
    public interface IFileService
    {
        // Blazor-side upload (IBrowserFile from InputFile component)
        Task<string> SaveFileAsync(IBrowserFile file, string subFolder);

        // API-side upload (IFormFile from multipart/form-data)
        Task<string> SaveFormFileAsync(IFormFile file, string subFolder);

        void DeleteFile(string filePath);
    }
}

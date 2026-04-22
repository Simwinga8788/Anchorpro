using Microsoft.AspNetCore.Components.Forms;

namespace AnchorPro.Services.Interfaces
{
    public interface IFileService
    {
        Task<string> SaveFileAsync(IBrowserFile file, string subFolder);
        void DeleteFile(string filePath);
    }
}

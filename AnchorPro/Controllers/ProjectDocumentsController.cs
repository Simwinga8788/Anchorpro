using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AnchorPro.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectDocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectDocumentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> UploadDocument([FromForm] int projectId, [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Project not found");

            // Save file locally to wwwroot/uploads
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var document = new ProjectDocument
            {
                ProjectId = projectId,
                FileName = file.FileName,
                FileUrl = "/uploads/" + uniqueFileName,
                UploadedAt = DateTime.UtcNow,
                UploadedById = userId
            };

            _context.ProjectDocuments.Add(document);
            await _context.SaveChangesAsync();

            return Ok(document);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var document = await _context.ProjectDocuments.FindAsync(id);
            if (document == null) return NotFound();

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", document.FileUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _context.ProjectDocuments.Remove(document);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}

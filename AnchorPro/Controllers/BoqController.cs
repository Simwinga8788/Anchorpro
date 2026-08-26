using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BoqController : ControllerBase
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public BoqController(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        /// <summary>
        /// GET /api/boq/project/{projectId}
        /// Returns the current (latest-version) Bill of Quantities for the given project with all sections and items.
        /// Once a BOQ is approved and revised, older versions remain in the database as an immutable history
        /// (see GET /api/boq/project/{projectId}/history) but are no longer returned here.
        /// </summary>
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetByProject(int projectId)
        {
            using var db = _factory.CreateDbContext();
            var boq = await db.BillsOfQuantities
                .Include(b => b.Sections.OrderBy(s => s.DisplayOrder))
                    .ThenInclude(s => s.Items.OrderBy(i => i.DisplayOrder))
                .Where(b => b.ProjectId == projectId)
                .OrderByDescending(b => b.VersionNumber)
                .FirstOrDefaultAsync();

            if (boq == null)
            {
                // Create a default starter BOQ if none exists
                var project = await db.Projects.FindAsync(projectId);
                if (project == null) return NotFound(new { message = "Project not found." });

                boq = new BillOfQuantities
                {
                    ProjectId = projectId,
                    Title = $"Bill of Quantities — {project.Name}",
                    Status = BoqStatus.Draft,
                    TotalContractSum = 0,
                    Sections = new List<BoqSection>
                    {
                        new BoqSection
                        {
                            SectionCode = "A",
                            SectionName = "Preliminary & General (P&Gs)",
                            DisplayOrder = 1,
                            Items = new List<BoqItem>
                            {
                                new BoqItem { ItemNumber = "A.1", Description = "Contractor site establishment, offices and facilities", UnitOfMeasure = "sum", Quantity = 1, Rate = 0, TotalAmount = 0, DisplayOrder = 1 },
                                new BoqItem { ItemNumber = "A.2", Description = "Contractual requirements, bonds, insurances and compliance", UnitOfMeasure = "sum", Quantity = 1, Rate = 0, TotalAmount = 0, DisplayOrder = 2 }
                            }
                        },
                        new BoqSection
                        {
                            SectionCode = "B",
                            SectionName = "Earthworks & Substructure",
                            DisplayOrder = 2,
                            Items = new List<BoqItem>
                            {
                                new BoqItem { ItemNumber = "B.1", Description = "Site clearance and topsoil excavation to 150mm depth", UnitOfMeasure = "m2", Quantity = 0, Rate = 0, TotalAmount = 0, DisplayOrder = 1 },
                                new BoqItem { ItemNumber = "B.2", Description = "Trench excavation for strip footings not exceeding 2.0m depth", UnitOfMeasure = "m3", Quantity = 0, Rate = 0, TotalAmount = 0, DisplayOrder = 2 },
                                new BoqItem { ItemNumber = "B.3", Description = "25MPa Reinforced concrete in foundation footings", UnitOfMeasure = "m3", Quantity = 0, Rate = 0, TotalAmount = 0, DisplayOrder = 3 }
                            }
                        }
                    }
                };

                db.BillsOfQuantities.Add(boq);
                await db.SaveChangesAsync();
            }

            return Ok(boq);
        }

        /// <summary>
        /// GET /api/boq/project/{projectId}/history
        /// Returns a summary of every version of the BOQ ever created for this project, newest first.
        /// </summary>
        [HttpGet("project/{projectId}/history")]
        public async Task<IActionResult> GetHistory(int projectId)
        {
            using var db = _factory.CreateDbContext();
            var versions = await db.BillsOfQuantities
                .Include(b => b.ApprovedBy)
                .Where(b => b.ProjectId == projectId)
                .OrderByDescending(b => b.VersionNumber)
                .Select(b => new
                {
                    b.Id,
                    b.VersionNumber,
                    b.Status,
                    b.TotalContractSum,
                    b.ApprovedAt,
                    ApprovedByName = b.ApprovedBy != null ? (b.ApprovedBy.FirstName + " " + b.ApprovedBy.LastName) : null
                })
                .ToListAsync();

            return Ok(versions);
        }

        /// <summary>
        /// POST /api/boq/{boqId}/approve
        /// Approve the BOQ, locking its line items from further edits. Required before a Payment
        /// Certificate can be raised against it in the intended workflow.
        /// </summary>
        [HttpPost("{boqId}/approve")]
        public async Task<IActionResult> Approve(int boqId)
        {
            using var db = _factory.CreateDbContext();
            var boq = await db.BillsOfQuantities.FindAsync(boqId);
            if (boq == null) return NotFound();

            if (boq.Status == BoqStatus.Approved || boq.Status == BoqStatus.Revised)
                return BadRequest("This Bill of Quantities is already approved.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            boq.Status = BoqStatus.Approved;
            boq.ApprovedAt = DateTime.UtcNow;
            boq.ApprovedById = userId;

            await db.SaveChangesAsync();
            return Ok(boq);
        }

        /// <summary>
        /// POST /api/boq/{boqId}/revise
        /// Start a new controlled revision of an approved BOQ: snapshots the approved version in place
        /// (marking it Revised, immutable history) and creates a new editable Draft copy — with the same
        /// sections/items, one version higher — for the change to be made against.
        /// </summary>
        [HttpPost("{boqId}/revise")]
        public async Task<IActionResult> Revise(int boqId)
        {
            using var db = _factory.CreateDbContext();
            var boq = await db.BillsOfQuantities
                .Include(b => b.Sections)
                    .ThenInclude(s => s.Items)
                .FirstOrDefaultAsync(b => b.Id == boqId);
            if (boq == null) return NotFound();

            if (boq.Status != BoqStatus.Approved)
                return BadRequest("Only an approved Bill of Quantities can be revised.");

            var revision = new BillOfQuantities
            {
                ProjectId = boq.ProjectId,
                Title = boq.Title,
                VersionNumber = boq.VersionNumber + 1,
                Status = BoqStatus.Draft,
                TotalContractSum = boq.TotalContractSum,
                Sections = boq.Sections.Select(s => new BoqSection
                {
                    SectionCode = s.SectionCode,
                    SectionName = s.SectionName,
                    Subtotal = s.Subtotal,
                    DisplayOrder = s.DisplayOrder,
                    Items = s.Items.Select(i => new BoqItem
                    {
                        ItemNumber = i.ItemNumber,
                        Description = i.Description,
                        UnitOfMeasure = i.UnitOfMeasure,
                        Quantity = i.Quantity,
                        Rate = i.Rate,
                        TotalAmount = i.TotalAmount,
                        Notes = i.Notes,
                        DisplayOrder = i.DisplayOrder
                    }).ToList()
                }).ToList()
            };

            boq.Status = BoqStatus.Revised;

            db.BillsOfQuantities.Add(revision);
            await db.SaveChangesAsync();

            return Ok(revision);
        }

        /// <summary>
        /// POST /api/boq/{boqId}/sections
        /// Add a new trade / work section to the BOQ
        /// </summary>
        [HttpPost("{boqId}/sections")]
        public async Task<IActionResult> AddSection(int boqId, [FromBody] BoqSectionDto dto)
        {
            using var db = _factory.CreateDbContext();
            var boq = await db.BillsOfQuantities.FindAsync(boqId);
            if (boq == null) return NotFound();
            if (boq.Status == BoqStatus.Approved || boq.Status == BoqStatus.Revised)
                return BadRequest("This Bill of Quantities is approved and can no longer be edited directly — start a revision instead.");

            var maxOrder = await db.BoqSections.Where(s => s.BillOfQuantitiesId == boqId).MaxAsync(s => (int?)s.DisplayOrder) ?? 0;

            var section = new BoqSection
            {
                BillOfQuantitiesId = boqId,
                SectionCode = dto.SectionCode,
                SectionName = dto.SectionName,
                DisplayOrder = maxOrder + 1
            };

            db.BoqSections.Add(section);
            await db.SaveChangesAsync();

            return Ok(section);
        }

        /// <summary>
        /// POST /api/boq/sections/{sectionId}/items
        /// Add a line item to a section
        /// </summary>
        [HttpPost("sections/{sectionId}/items")]
        public async Task<IActionResult> AddItem(int sectionId, [FromBody] BoqItemDto dto)
        {
            using var db = _factory.CreateDbContext();
            var section = await db.BoqSections.Include(s => s.BillOfQuantities).FirstOrDefaultAsync(s => s.Id == sectionId);
            if (section == null) return NotFound();
            if (section.BillOfQuantities != null && (section.BillOfQuantities.Status == BoqStatus.Approved || section.BillOfQuantities.Status == BoqStatus.Revised))
                return BadRequest("This Bill of Quantities is approved and can no longer be edited directly — start a revision instead.");

            var maxOrder = await db.BoqItems.Where(i => i.BoqSectionId == sectionId).MaxAsync(i => (int?)i.DisplayOrder) ?? 0;

            var item = new BoqItem
            {
                BoqSectionId = sectionId,
                ItemNumber = dto.ItemNumber,
                Description = dto.Description,
                UnitOfMeasure = dto.UnitOfMeasure,
                Quantity = dto.Quantity,
                Rate = dto.Rate,
                TotalAmount = Math.Round(dto.Quantity * dto.Rate, 2),
                DisplayOrder = maxOrder + 1
            };

            db.BoqItems.Add(item);
            await db.SaveChangesAsync();

            await RecalculateBoqTotalsAsync(db, section.BillOfQuantitiesId);

            return Ok(item);
        }

        /// <summary>
        /// PUT /api/boq/items/{itemId}
        /// Update quantity, rate or description of an item
        /// </summary>
        [HttpPut("items/{itemId}")]
        public async Task<IActionResult> UpdateItem(int itemId, [FromBody] BoqItemDto dto)
        {
            using var db = _factory.CreateDbContext();
            var item = await db.BoqItems.Include(i => i.BoqSection).ThenInclude(s => s!.BillOfQuantities).FirstOrDefaultAsync(i => i.Id == itemId);
            if (item == null) return NotFound();
            var parentBoq = item.BoqSection?.BillOfQuantities;
            if (parentBoq != null && (parentBoq.Status == BoqStatus.Approved || parentBoq.Status == BoqStatus.Revised))
                return BadRequest("This Bill of Quantities is approved and can no longer be edited directly — start a revision instead.");

            item.ItemNumber = dto.ItemNumber;
            item.Description = dto.Description;
            item.UnitOfMeasure = dto.UnitOfMeasure;
            item.Quantity = dto.Quantity;
            item.Rate = dto.Rate;
            item.TotalAmount = Math.Round(dto.Quantity * dto.Rate, 2);

            await db.SaveChangesAsync();

            if (item.BoqSection != null)
            {
                await RecalculateBoqTotalsAsync(db, item.BoqSection.BillOfQuantitiesId);
            }

            return Ok(item);
        }

        /// <summary>
        /// DELETE /api/boq/items/{itemId}
        /// Remove an item
        /// </summary>
        [HttpDelete("items/{itemId}")]
        public async Task<IActionResult> DeleteItem(int itemId)
        {
            using var db = _factory.CreateDbContext();
            var item = await db.BoqItems.Include(i => i.BoqSection).ThenInclude(s => s!.BillOfQuantities).FirstOrDefaultAsync(i => i.Id == itemId);
            if (item == null) return NotFound();
            var parentBoq = item.BoqSection?.BillOfQuantities;
            if (parentBoq != null && (parentBoq.Status == BoqStatus.Approved || parentBoq.Status == BoqStatus.Revised))
                return BadRequest("This Bill of Quantities is approved and can no longer be edited directly — start a revision instead.");

            var boqId = item.BoqSection?.BillOfQuantitiesId ?? 0;
            db.BoqItems.Remove(item);
            await db.SaveChangesAsync();

            if (boqId > 0)
            {
                await RecalculateBoqTotalsAsync(db, boqId);
            }

            return Ok(new { message = "Item deleted." });
        }

        /// <summary>
        /// POST /api/boq/{boqId}/import-csv
        /// Bulk import BOQ from CSV spreadsheet (columns: SectionCode, SectionName, ItemNumber, Description, Unit, Quantity, Rate)
        /// </summary>
        [HttpPost("{boqId}/import-csv")]
        public async Task<IActionResult> ImportCsv(int boqId, [FromBody] BoqImportCsvDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CsvContent))
                return BadRequest("CSV content is empty.");

            using var db = _factory.CreateDbContext();
            var boq = await db.BillsOfQuantities.FindAsync(boqId);
            if (boq == null) return NotFound();
            if (boq.Status == BoqStatus.Approved || boq.Status == BoqStatus.Revised)
                return BadRequest("This Bill of Quantities is approved and can no longer be edited directly — start a revision instead.");

            var lines = dto.CsvContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length <= 1)
                return BadRequest("CSV requires header and at least one data row.");

            var sections = await db.BoqSections.Where(s => s.BillOfQuantitiesId == boqId).ToListAsync();
            var itemsToAdd = new List<BoqItem>();

            // Expected columns: SectionCode, SectionName, ItemNumber, Description, Unit, Quantity, Rate
            int sectionOrder = sections.Count;
            int itemOrder = 0;

            for (int i = 1; i < lines.Length; i++)
            {
                var row = lines[i].Split(',');
                if (row.Length < 6) continue;

                var secCode = row[0].Trim();
                var secName = row.Length >= 7 ? row[1].Trim() : "General";
                var itemNo = row[row.Length >= 7 ? 2 : 1].Trim();
                var desc = row[row.Length >= 7 ? 3 : 2].Trim();
                var unit = row[row.Length >= 7 ? 4 : 3].Trim();
                decimal.TryParse(row[row.Length >= 7 ? 5 : 4].Trim(), out var qty);
                decimal.TryParse(row[row.Length >= 7 ? 6 : 5].Trim(), out var rate);

                var section = sections.FirstOrDefault(s => s.SectionCode.Equals(secCode, StringComparison.OrdinalIgnoreCase));
                if (section == null)
                {
                    section = new BoqSection
                    {
                        BillOfQuantitiesId = boqId,
                        SectionCode = string.IsNullOrWhiteSpace(secCode) ? "SEC" : secCode,
                        SectionName = string.IsNullOrWhiteSpace(secName) ? "General Works" : secName,
                        DisplayOrder = ++sectionOrder
                    };
                    db.BoqSections.Add(section);
                    await db.SaveChangesAsync();
                    sections.Add(section);
                }

                itemsToAdd.Add(new BoqItem
                {
                    BoqSectionId = section.Id,
                    ItemNumber = string.IsNullOrWhiteSpace(itemNo) ? $"{section.SectionCode}.{++itemOrder}" : itemNo,
                    Description = desc,
                    UnitOfMeasure = string.IsNullOrWhiteSpace(unit) ? "item" : unit,
                    Quantity = qty,
                    Rate = rate,
                    TotalAmount = Math.Round(qty * rate, 2),
                    DisplayOrder = ++itemOrder
                });
            }

            db.BoqItems.AddRange(itemsToAdd);
            await db.SaveChangesAsync();

            await RecalculateBoqTotalsAsync(db, boqId);

            return Ok(new { message = $"Successfully imported {itemsToAdd.Count} items into BOQ." });
        }

        private static async Task RecalculateBoqTotalsAsync(ApplicationDbContext db, int boqId)
        {
            var sections = await db.BoqSections
                .Include(s => s.Items)
                .Where(s => s.BillOfQuantitiesId == boqId)
                .ToListAsync();

            decimal grandTotal = 0;
            foreach (var section in sections)
            {
                section.Subtotal = section.Items.Sum(i => i.TotalAmount);
                grandTotal += section.Subtotal;
            }

            var boq = await db.BillsOfQuantities.FindAsync(boqId);
            if (boq != null)
            {
                boq.TotalContractSum = grandTotal;
                
                // Update linked project contract sum / budget
                var project = await db.Projects.FindAsync(boq.ProjectId);
                if (project != null)
                {
                    project.Budget = grandTotal;
                }
            }

            await db.SaveChangesAsync();
        }
    }

    public class BoqSectionDto
    {
        public string SectionCode { get; set; } = string.Empty;
        public string SectionName { get; set; } = string.Empty;
    }

    public class BoqItemDto
    {
        public string ItemNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string UnitOfMeasure { get; set; } = "m3";
        public decimal Quantity { get; set; }
        public decimal Rate { get; set; }
    }

    public class BoqImportCsvDto
    {
        public string CsvContent { get; set; } = string.Empty;
    }
}

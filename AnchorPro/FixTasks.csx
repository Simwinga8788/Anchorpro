using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using AnchorPro.Data;
using AnchorPro.Data.Entities;

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseNpgsql("Host=localhost;Database=anchorpro;Username=postgres;Password=postgres");

using var context = new ApplicationDbContext(optionsBuilder.Options);

var brokenTasks = context.ProjectTasks.Where(t => t.StartDate == null || t.DueDate == null).ToList();

foreach (var task in brokenTasks)
{
    task.StartDate = DateTime.UtcNow.AddDays(-1);
    task.DueDate = DateTime.UtcNow.AddDays(5);
}

context.SaveChanges();
Console.WriteLine($"Fixed {brokenTasks.Count} broken tasks.");

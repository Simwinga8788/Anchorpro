using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System;

// A simple script to invoke GetUnreadCountAsync directly to see the exception
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContextFactory<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// We just need to resolve IAlertService. But wait, we can just instantiate ApplicationDbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

Console.WriteLine("Connecting to: " + connectionString);

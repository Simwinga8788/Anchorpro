
using System;
using System.Linq;
using Npgsql;
// Set ANCHORPRO_DB_CONNECTION (Npgsql connection string format) before running — never hardcode credentials here.
var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");
using var conn = new NpgsqlConnection(connString);
conn.Open();

Console.WriteLine("--- Users ---");
using (var cmd = new NpgsqlCommand("SELECT \"Id\", \"Email\" FROM \"AspNetUsers\" WHERE \"Email\" = 'simwinga87888@gmail.com'", conn))
using (var reader = cmd.ExecuteReader())
{
    while (reader.Read()) Console.WriteLine($"{reader[0]} - {reader[1]}");
}

Console.WriteLine("--- User Roles ---");
using (var cmd = new NpgsqlCommand("SELECT u.\"Email\", r.\"Name\" FROM \"AspNetUserRoles\" ur JOIN \"AspNetUsers\" u ON ur.\"UserId\" = u.\"Id\" JOIN \"AspNetRoles\" r ON ur.\"RoleId\" = r.\"Id\" WHERE u.\"Email\" = 'simwinga87888@gmail.com'", conn))
using (var reader = cmd.ExecuteReader())
{
    while (reader.Read()) Console.WriteLine($"{reader[0]} - {reader[1]}");
}

Console.WriteLine("--- TenantRolePermissions ---");
using (var cmd = new NpgsqlCommand("SELECT p.\"RoleName\", p.\"AllowedRoutesJson\" FROM \"TenantRolePermissions\" p JOIN \"AspNetUsers\" u ON p.\"TenantId\" = u.\"TenantId\" WHERE u.\"Email\" = 'simwinga87888@gmail.com'", conn))
using (var reader = cmd.ExecuteReader())
{
    while (reader.Read()) Console.WriteLine($"{reader[0]} - {reader[1]}");
}


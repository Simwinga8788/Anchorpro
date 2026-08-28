
using System;
using System.Linq;
using Npgsql;
// Set ANCHORPRO_DB_CONNECTION (Npgsql connection string format) before running — never hardcode credentials here.
var connString = Environment.GetEnvironmentVariable("ANCHORPRO_DB_CONNECTION")
    ?? throw new InvalidOperationException("ANCHORPRO_DB_CONNECTION environment variable is not set.");
using var conn = new NpgsqlConnection(connString);
conn.Open();

const int tenantId = 6;

Console.WriteLine("--- Tenant OperationMode before ---");
using (var cmd = new NpgsqlCommand("SELECT \"Id\", \"Name\", \"OperationMode\" FROM \"Tenants\" WHERE \"Id\" = @id", conn))
{
    cmd.Parameters.AddWithValue("id", tenantId);
    using var reader = cmd.ExecuteReader();
    while (reader.Read()) Console.WriteLine($"Id={reader[0]} Name={reader[1]} OperationMode={reader[2]}");
}

Console.WriteLine("--- Updating OperationMode to 3 (SiteDiary / Construction & Civil Works) ---");
using (var cmd = new NpgsqlCommand("UPDATE \"Tenants\" SET \"OperationMode\" = 3, \"UpdatedAt\" = now() WHERE \"Id\" = @id", conn))
{
    cmd.Parameters.AddWithValue("id", tenantId);
    var rows = cmd.ExecuteNonQuery();
    Console.WriteLine($"Rows updated: {rows}");
}

Console.WriteLine("--- Tenant OperationMode after ---");
using (var cmd = new NpgsqlCommand("SELECT \"Id\", \"Name\", \"OperationMode\" FROM \"Tenants\" WHERE \"Id\" = @id", conn))
{
    cmd.Parameters.AddWithValue("id", tenantId);
    using var reader = cmd.ExecuteReader();
    while (reader.Read()) Console.WriteLine($"Id={reader[0]} Name={reader[1]} OperationMode={reader[2]}");
}

// Seed the construction terminology dictionary that AuthController.Register() would have seeded
// at signup time for a tenant registered with Industry="Construction" — this tenant was originally
// registered as Mining & Extraction, so it never got these. Idempotent: skip any key already present.
Console.WriteLine("--- Seeding construction Dictionary settings (idempotent) ---");
var dictEntries = new (string Key, string Value)[]
{
    ("Dict.MineCaptain", "Site Engineer"),
    ("Dict.ShiftBoss", "Site Supervisor"),
    ("Dict.Ore", "Earthworks"),
    ("Dict.MaterialLabel", "Concrete / Earth"),
    ("Dict.Stope", "Section / Area"),
    ("Dict.Pit", "Site"),
    ("Dict.Tonnage", "Target Volume"),
    ("Dict.DrillRingAndHole", "Section & Plot"),
};

foreach (var (key, value) in dictEntries)
{
    using var checkCmd = new NpgsqlCommand(
        "SELECT COUNT(*) FROM \"SystemSettings\" WHERE \"TenantId\" = @tid AND \"Key\" = @key", conn);
    checkCmd.Parameters.AddWithValue("tid", tenantId);
    checkCmd.Parameters.AddWithValue("key", key);
    var exists = (long)checkCmd.ExecuteScalar()! > 0;

    if (exists)
    {
        Console.WriteLine($"  skip (exists): {key}");
        continue;
    }

    using var insertCmd = new NpgsqlCommand(
        "INSERT INTO \"SystemSettings\" (\"TenantId\", \"Key\", \"Value\", \"Description\", \"Group\") " +
        "VALUES (@tid, @key, @value, '', 'Dictionary')", conn);
    insertCmd.Parameters.AddWithValue("tid", tenantId);
    insertCmd.Parameters.AddWithValue("key", key);
    insertCmd.Parameters.AddWithValue("value", value);
    var rows = insertCmd.ExecuteNonQuery();
    Console.WriteLine($"  inserted: {key} = {value} ({rows} row)");
}
